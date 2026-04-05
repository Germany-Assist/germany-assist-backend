import { v4 as uuid } from "uuid";
import path from "node:path";
import sharpUtil from "../utils/sharp.util.js";
import hashIdUtil from "../utils/hashId.util.js";
import { AppError } from "../utils/error.class.js";
import AssetRepository from "../modules/assets/assets.repository.js";
/**
 * Centralized AssetService.
 * Can be called from any service (PostService, UserService, SPService, etc.)
 * Handles:
 * 1. Validation
 * 2. Formatting (image/video/document)
 * 3. Upload to S3
 * 4. Persist metadata
 * 5. Generate signed URLs
 */
class AssetService {
  /**
   * Upload files
   * @param {Object} options
   * @param {string} options.type - asset type - type should fall in one of the many options provided in the constraints (asset-types)table
   * @param {Array} options.files - array of files { buffer, originalname, mimetype }
   * @param {Object} options.auth - authenticated user info
   * @param {Object} options.params - additional params (postId, serviceId) in case of profile image etc - its useless
   * @param {Object} options.transaction - optional DB transaction
   * @returns array of uploaded files with signed URLs for display
   */

  static async upload({ type, files, auth, params, transaction }) {
    if (!transaction) throw new AppError(400, "Transaction is required");
    if (!files || files.length === 0) {
      throw new AppError(400, "No files provided");
    }

    // 1️⃣ Extract constraints (limits, media type, base key, thumb)
    const constraints = await AssetRepository.extractConstrains(type);

    // 2️⃣ Build search filters (for limits and ownership)
    const searchFilters = this.formatSearchFilters(
      type,
      auth,
      params,
      constraints,
    );
    // 3️⃣ Validate files against count & size
    await this.validateFiles(
      type,
      files,
      searchFilters,
      constraints,
      transaction,
    );

    // 4️⃣ Format files depending on media type
    let filesToUpload;
    switch (constraints.mediaType) {
      case "image":
        filesToUpload = await this.formatImages(files, type, constraints);
        break;
      case "video":
        filesToUpload = this.formatVideos(files, type, constraints);
        break;
      case "document":
        filesToUpload = this.formatDocuments(files, type, constraints);
        break;
      default:
        throw new AppError(500, "Invalid media type");
    }

    // 5️⃣ Upload to S3
    await AssetRepository.uploadToS3(filesToUpload);

    // 6️⃣ Persist metadata in DB
    const assets = this.formatForAssets(
      filesToUpload,
      auth,
      searchFilters,
      constraints.mediaType,
    );
    await AssetRepository.saveAssets(assets, transaction);

    // 7️⃣ Generate signed URLs
    const publicUrls = await AssetRepository.generateSignedUrls(filesToUpload);
    return publicUrls;
  }

  // ------------------- Helper functions -------------------

  // Build filters for DB queries
  static formatSearchFilters(type, auth, params, constraints) {
    const filters = { key: type };
    const ownerType = constraints.ownerType;

    switch (ownerType) {
      case "serviceProvider":
        if (!auth.relatedId) throw new AppError(500, "Invalid upload attempt");
        filters.serviceProviderId = auth.relatedId;
        break;
      case "service":
        if (!auth.relatedId) throw new AppError(500, "Invalid upload attempt");
        filters.serviceId = hashIdUtil.hashIdDecode(params.id);
        filters.serviceProviderId = auth.relatedId;
        break;
      case "post":
        if (!auth.relatedId) throw new AppError(500, "Invalid upload attempt");
        filters.postId = hashIdUtil.hashIdDecode(params.id);
        filters.serviceProviderId = auth.relatedId;
        break;
      case "verificationRequest":
        if (!auth.relatedId) throw new AppError(500, "Invalid upload attempt");
        filters.verificationRequestId = hashIdUtil.hashIdDecode(params.id);
        filters.serviceProviderId = auth.relatedId;
        break;
      case "user":
        filters.userId = auth.id;
        break;
      default:
        throw new AppError(500, "Invalid owner type");
    }

    return filters;
  }

  // Validate file sizes and upload limits
  static async validateFiles(
    type,
    files,
    searchFilters,
    constraints,
    transaction,
  ) {
    const totalFiles = files.length;
    const currentCount = await AssetRepository.countAssets(
      searchFilters,
      transaction,
    );
    if (
      constraints.limit !== "*" &&
      currentCount + totalFiles > constraints.limit
    ) {
      throw new AppError(
        400,
        `Upload limit exceeded (${constraints.limit}) for ${type}`,
      );
    }

    for (const file of files) {
      if (constraints.size !== "*" && file.buffer.length > constraints.size) {
        throw new AppError(413, `File size exceeds allowed limit for ${type}`);
      }
    }
  }

  static async formatImages(files, type, constrains) {
    const basekey = constrains.basekey;
    const thumb = constrains.thumb;
    const images = [];
    for (const file of files) {
      const id = uuid();
      const imageKey = `${basekey}/${id}.webp`;
      const imageBuffer = await sharpUtil.imageResizeS3(file, 400, 400);
      images.push({
        key: imageKey,
        buffer: imageBuffer,
        type,
        thumb: false,
        id,
        size: imageBuffer.length,
        contentType: "image/webp",
      });

      if (thumb) {
        const thumbKey = `${basekey}/thumb/${id}.webp`;
        const thumbBuffer = await sharpUtil.imageResizeS3(file, 200, 200);

        images.push({
          key: thumbKey,
          buffer: thumbBuffer,
          type,
          thumb: true,
          id,
          size: thumbBuffer.length,
          contentType: "image/webp",
        });
      }
    }

    return images;
  }

  // Format videos
  static formatVideos(files, type, constraints) {
    const baseKey = constraints.basekey;
    return files.map((file) => {
      const id = uuid();
      const ext = path.extname(file.originalname);
      return {
        key: `${baseKey}/${id}${ext}`,
        buffer: file.buffer,
        type,
        thumb: false,
        id,
        size: file.buffer.length,
      };
    });
  }

  // Format documents
  static formatDocuments(files, type, constraints) {
    const baseKey = constraints.basekey;
    return files.map((file) => {
      const id = uuid();
      const ext = path.extname(file.originalname);
      return {
        key: `${baseKey}/${id}${ext}`,
        buffer: file.buffer,
        type,
        thumb: false,
        id,
        size: file.buffer.length,
      };
    });
  }

  // Format for DB storage
  static formatForAssets(files, auth, searchFilters, mediaType) {
    return files.map((file) => ({
      name: file.id,
      size: file.size,
      mediaType,
      serviceProviderId: auth.relatedId ?? null,
      serviceId: searchFilters.serviceId ?? null,
      postId: searchFilters.postId ?? null,
      verificationRequestId: searchFilters.verificationRequestId ?? null,
      userId: auth.id,
      key: file.type,
      thumb: file.thumb,
      url: file.key,
      confirmed: true,
    }));
  }
}

export default AssetService;
