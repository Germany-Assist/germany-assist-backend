import { sequelize } from "../../configs/database.js";
import { defineConstrains } from "../index.js";
import User from "../models/user.js";
import ServiceProvider from "../models/service_provider.js";
import Service from "../models/service.js";
import Category from "../models/category.js";
import Timeline from "../models/timeline.js";
import Order from "../models/order.js";
import Review from "../models/review.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import Favorite from "../models/favorite.js";
import Asset from "../models/assets.js";
import Coupon from "../models/coupon.js";
import Employer from "../models/employer.js";
import UserRole from "../models/user_role.js";
import Notification from "../models/notification.js";
import Event from "../models/event.js";
import Subscriber from "../models/subscriber.js";
import Chat from "../models/chat.js";
import Token from "../models/tokens.js";
import StripeEvent from "../models/stripe_event.js";
import bcryptUtil from "../../utils/bcrypt.util.js";
import { v4 as uuidv4 } from "uuid";

// Helper function to get random element from array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get random number in range
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to get random float in range
const randomFloat = (min, max) => Math.random() * (max - min) + min;

// Helper function to generate random date
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate random email
const randomEmail = (name) => `${name.toLowerCase().replace(/\s+/g, '.')}${randomInt(1, 9999)}@test.com`;

// Helper function to generate random phone
const randomPhone = () => `+49${randomInt(100000000, 999999999)}`;

// Sample data arrays
const firstNames = [
  "Max", "Anna", "Thomas", "Sarah", "Michael", "Julia", "David", "Lisa",
  "Daniel", "Maria", "Stefan", "Sophie", "Andreas", "Emma", "Christian",
  "Laura", "Markus", "Hannah", "Sebastian", "Mia", "Jan", "Lea", "Florian",
  "Emily", "Alexander", "Lena", "Benjamin", "Nina", "Matthias", "Julia",
  "Philipp", "Katharina", "Tobias", "Anna", "Nicolas", "Sarah", "Felix",
  "Marie", "Lukas", "Clara", "Jonas", "Amelie", "Simon", "Elena", "Fabian",
  "Isabella", "Tim", "Charlotte", "Kevin", "Lina", "Martin", "Paula"
];

const lastNames = [
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner",
  "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter",
  "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann", "Braun",
  "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner", "Schmitz",
  "Krause", "Meier", "Lehmann", "Schmid", "Schulze", "Maier", "Köhler",
  "Herrmann", "König", "Walter", "Huber", "Kaiser", "Peters", "Lang",
  "Scholz", "Möller", "Weiß", "Jung", "Hahn", "Schubert", "Vogel", "Friedrich"
];

const serviceTitles = [
  "Visa Application Assistance", "Document Translation Service", "German Language Tutoring",
  "Career Coaching Session", "Housing Search Support", "Bank Account Setup Help",
  "Legal Consultation", "Tax Registration Service", "Professional Networking Event",
  "Cultural Integration Workshop", "Work Permit Application", "Residence Permit Help",
  "CV Writing Service", "Job Interview Preparation", "Apartment Finding Service",
  "Health Insurance Setup", "Driver's License Translation", "University Application Help",
  "Business Registration Service", "Contract Review Service", "Immigration Consultation",
  "Language Exchange Program", "Job Search Assistance", "Relocation Support",
  "Business German Course", "Technical Translation", "Medical Appointment Booking",
  "School Enrollment Help", "Utilities Setup Service", "Internet & Phone Setup"
];

const serviceDescriptions = [
  "Comprehensive assistance with visa application process, including document preparation and submission guidance.",
  "Professional translation services for official documents, certificates, and legal papers.",
  "Personalized German language lessons tailored to your level and goals.",
  "Expert career guidance to help you navigate the German job market and advance your career.",
  "Dedicated support in finding suitable accommodation in your preferred area.",
  "Step-by-step guidance for opening a German bank account and understanding banking procedures.",
  "Professional legal advice on immigration, employment, and residency matters.",
  "Complete assistance with tax registration and understanding German tax obligations.",
  "Connect with professionals and expand your network in Germany.",
  "Learn about German culture, customs, and social norms to integrate smoothly.",
  "Expert help with work permit applications and requirements.",
  "Guidance through the residence permit application process.",
  "Professional CV writing service tailored for the German job market.",
  "Comprehensive interview preparation including common questions and cultural tips.",
  "Personalized apartment hunting service with local market knowledge.",
  "Help setting up health insurance coverage in Germany.",
  "Official translation of your driver's license for use in Germany.",
  "Assistance with university applications and admission processes.",
  "Complete business registration service for entrepreneurs.",
  "Professional review of employment contracts and legal documents.",
  "Expert immigration consultation for long-term residency planning.",
  "Language exchange opportunities with native German speakers.",
  "Personalized job search strategies and application support.",
  "Comprehensive relocation support from planning to settling in.",
  "Business-focused German language training for professionals.",
  "Technical document translation for engineering and IT professionals.",
  "Help booking medical appointments and understanding the healthcare system.",
  "Assistance with school enrollment for children.",
  "Support setting up utilities including electricity, gas, and water.",
  "Help with internet and phone contract setup and provider selection."
];

const postDescriptions = [
  "Excited to announce our new service offering!",
  "Check out our latest success story from a satisfied client.",
  "Important update about our service availability.",
  "Tips and tricks for navigating life in Germany.",
  "We're expanding our team! Looking for talented professionals.",
  "Client testimonial: How our service made a difference.",
  "Upcoming workshop: Learn about German work culture.",
  "New resources available: Download our free guide.",
  "Success story: Helping a family relocate to Berlin.",
  "Behind the scenes: Meet our team members.",
  "FAQ: Common questions about our services answered.",
  "Event announcement: Join us for a networking evening.",
  "Service update: New features and improvements.",
  "Client spotlight: Celebrating our achievements together.",
  "Educational content: Understanding German bureaucracy.",
  "Partnership announcement: Working with new organizations.",
  "Holiday schedule: Important dates to remember.",
  "Testimonial: Real experiences from our clients.",
  "Resource library: New guides and materials available.",
  "Community update: Growing our network of professionals."
];

const reviewBodies = [
  "Excellent service! Very professional and helpful.",
  "Highly recommend this service provider.",
  "Great experience, would use again.",
  "Very satisfied with the quality of service.",
  "Professional and efficient service delivery.",
  "Outstanding support throughout the process.",
  "Exceeded my expectations in every way.",
  "Helpful and knowledgeable team members.",
  "Quick response time and great communication.",
  "Value for money and excellent results.",
  "Could be improved in some areas but overall good.",
  "Satisfactory service with room for improvement.",
  "Good service but communication could be better.",
  "Met my expectations, would recommend.",
  "Professional approach and good outcomes.",
  "Helpful service with friendly staff.",
  "Efficient process and clear communication.",
  "Good value and reliable service.",
  "Positive experience overall.",
  "Would use this service again in the future."
];

const commentBodies = [
  "Great post! Thanks for sharing.",
  "This is very helpful information.",
  "I have a question about this.",
  "Looking forward to more updates.",
  "This resonates with my experience.",
  "Thanks for the insights!",
  "Can you provide more details?",
  "Excellent point made here.",
  "I agree with this perspective.",
  "This is exactly what I needed.",
  "Very informative, thank you.",
  "I'd like to learn more about this.",
  "This helped clarify things for me.",
  "Good to know, thanks!",
  "I have a similar experience.",
  "This is valuable information.",
  "Appreciate the update.",
  "Looking forward to trying this.",
  "This makes sense, thanks.",
  "Helpful content as always."
];

const notificationMessages = [
  "Your service has been approved!",
  "New order received for your service.",
  "You have a new review on your service.",
  "Payment received for order #",
  "Your service application is pending review.",
  "New comment on your post.",
  "Someone favorited your service.",
  "Order status updated to fulfilled.",
  "New subscriber to your timeline.",
  "Your post has been approved.",
  "Reminder: Complete your profile.",
  "New message in your chat.",
  "Your service has been published.",
  "Payment refund processed.",
  "New follower on your timeline.",
  "Your review was helpful to others.",
  "Service update available.",
  "New event scheduled.",
  "Your account has been verified.",
  "Welcome to Germany Assist!"
];

/**
 * Main function to seed test data
 */
export default async function seedTestData() {
  try {
    console.log("🌱 Starting test data seeding...");

    // Ensure constraints are defined
    defineConstrains();

    // Get existing categories (should be seeded by dbInit)
    const categories = await Category.findAll();
    if (categories.length === 0) {
      throw new Error("Categories must be seeded first. Please run 'npm run dbInit' first.");
    }
    const categoryIds = categories.map(c => c.id);

    // 1. Seed Users (50-100 records + 1 default user)
    console.log("👥 Seeding Users...");
    
    // Create default test user first (for easy login during development)
    const defaultUser = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: bcryptUtil.hashPassword("password123"),
      dob: new Date(1990, 0, 1),
      isVerified: true,
      isRoot: false,
    };
    
    // Check if default user already exists, if not create it
    let defaultUserRecord = await User.findOne({ where: { email: defaultUser.email } });
    if (!defaultUserRecord) {
      defaultUserRecord = await User.create(defaultUser);
      console.log(`✅ Created default test user: ${defaultUser.email} (password: password123)`);
    } else {
      console.log(`ℹ️  Default test user already exists: ${defaultUser.email} (password: password123)`);
    }
    
    // Create random users
    const userCount = randomInt(50, 100);
    const users = [];
    for (let i = 0; i < userCount; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      users.push({
        firstName,
        lastName,
        email: randomEmail(`${firstName} ${lastName}`),
        password: bcryptUtil.hashPassword("Test123!@#"),
        dob: randomDate(new Date(1970, 0, 1), new Date(2005, 11, 31)),
        isVerified: Math.random() > 0.3, // 70% verified
        isRoot: false,
      });
    }
    const createdRandomUsers = await User.bulkCreate(users, { returning: true });
    const createdUsers = [defaultUserRecord, ...createdRandomUsers];
    console.log(`✅ Created ${createdRandomUsers.length} random users (total: ${createdUsers.length} including default)`);

    // 2. Seed Service Providers (20-40 records)
    console.log("🏢 Seeding Service Providers...");
    const serviceProviderCount = randomInt(20, 40);
    const serviceProviders = [];
    for (let i = 0; i < serviceProviderCount; i++) {
      const name = `${randomElement(firstNames)} ${randomElement(lastNames)} Services`;
      serviceProviders.push({
        name,
        about: `We are a professional service provider specializing in helping people navigate life in Germany. Our team has years of experience and is dedicated to providing excellent service.`,
        description: `Comprehensive services for expats and newcomers to Germany. We offer personalized support and expert guidance to help you succeed.`,
        email: randomEmail(name),
        phoneNumber: randomPhone(),
        image: `https://picsum.photos/seed/${uuidv4()}/400/400`,
        isVerified: Math.random() > 0.4, // 60% verified
        views: randomInt(0, 1000),
        rating: parseFloat(randomFloat(3.5, 5.0).toFixed(1)),
        totalReviews: randomInt(0, 50),
      });
    }
    const createdServiceProviders = await ServiceProvider.bulkCreate(serviceProviders, { returning: true });
    console.log(`✅ Created ${createdServiceProviders.length} service providers`);

    // 3. Seed Employers (15-30 records)
    console.log("💼 Seeding Employers...");
    const employerCount = randomInt(15, 30);
    const employers = [];
    for (let i = 0; i < employerCount; i++) {
      const name = `${randomElement(lastNames)} GmbH`;
      employers.push({
        name,
        about: `We are a leading employer in Germany, offering excellent opportunities for professionals.`,
        description: `Join our team and advance your career in Germany. We offer competitive packages and a supportive work environment.`,
        email: randomEmail(name),
        phoneNumber: randomPhone(),
        image: `https://picsum.photos/seed/${uuidv4()}/400/400`,
        isVerified: Math.random() > 0.3, // 70% verified
        views: randomInt(0, 500),
        rating: parseFloat(randomFloat(3.0, 5.0).toFixed(1)),
        totalReviews: randomInt(0, 30),
      });
    }
    const createdEmployers = await Employer.bulkCreate(employers, { returning: true });
    console.log(`✅ Created ${createdEmployers.length} employers`);

    // 4. Seed User Roles
    console.log("👤 Seeding User Roles...");
    const userRoles = [];
    const roles = ["client", "admin", "super_admin"];
    const serviceProviderRoles = ["service_provider_root", "service_provider_rep"];
    const employerRoles = ["employer_root", "employer_rep"];

    // Assign role to default user first (give it client role for basic testing)
    const defaultUserRole = await UserRole.findOne({ where: { userId: defaultUserRecord.id } });
    if (!defaultUserRole) {
      await UserRole.create({
        userId: defaultUserRecord.id,
        role: "client",
        relatedId: null,
        relatedType: null,
      });
      console.log(`✅ Assigned 'client' role to default test user`);
    }

    // Assign roles to random users (skip default user at index 0)
    for (let i = 1; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      let role, relatedId, relatedType;

      // Adjust indices since we're skipping index 0 (default user)
      const adjustedIndex = i - 1;

      if (adjustedIndex < createdServiceProviders.length) {
        // First users get service provider roles
        role = randomElement(serviceProviderRoles);
        relatedId = createdServiceProviders[adjustedIndex].id;
        relatedType = "ServiceProvider";
      } else if (adjustedIndex < createdServiceProviders.length + createdEmployers.length) {
        // Next users get employer roles
        const employerIndex = adjustedIndex - createdServiceProviders.length;
        role = randomElement(employerRoles);
        relatedId = createdEmployers[employerIndex].id;
        relatedType = "Employer";
      } else if (adjustedIndex < createdServiceProviders.length + createdEmployers.length + 5) {
        // Some users get admin roles
        role = randomElement(["admin", "super_admin"]);
        relatedId = null;
        relatedType = null;
      } else {
        // Rest are clients
        role = "client";
        relatedId = null;
        relatedType = null;
      }

      userRoles.push({
        userId: user.id,
        role,
        relatedId,
        relatedType,
      });
    }
    await UserRole.bulkCreate(userRoles);
    console.log(`✅ Created ${userRoles.length} user roles for random users`);

    // 5. Seed Services (80-100 records) - IMPORTANT: Services are key
    console.log("🛠️ Seeding Services...");
    const serviceCount = randomInt(80, 100);
    const services = [];
    const serviceUserMap = new Map(); // Track which user owns which service

    for (let i = 0; i < serviceCount; i++) {
      const serviceProvider = randomElement(createdServiceProviders);
      // Find a user with service provider role for this provider
      const providerUser = createdUsers.find((u, idx) => 
        userRoles[idx]?.relatedId === serviceProvider.id && 
        userRoles[idx]?.relatedType === "ServiceProvider"
      ) || randomElement(createdUsers);

      const title = randomElement(serviceTitles);
      const description = randomElement(serviceDescriptions);
      const type = randomElement(["oneTime", "subscription"]);
      const price = parseFloat(randomFloat(10, 500).toFixed(2));

      services.push({
        title,
        description,
        userId: providerUser.id,
        serviceProviderId: serviceProvider.id,
        categoryId: randomElement(categoryIds),
        type,
        price,
        views: randomInt(0, 500),
        rating: parseFloat(randomFloat(3.0, 5.0).toFixed(1)),
        totalReviews: randomInt(0, 30),
        approved: Math.random() > 0.2, // 80% approved
        rejected: false,
        published: Math.random() > 0.3, // 70% published
        quantity: type === "oneTime" ? randomInt(1, 10) : null,
      });

      serviceUserMap.set(i, providerUser.id);
    }
    const createdServices = await Service.bulkCreate(services, { returning: true });
    console.log(`✅ Created ${createdServices.length} services`);

    // 6. Seed Timelines (one per service)
    console.log("📅 Seeding Timelines...");
    const timelines = createdServices.map((service, index) => ({
      serviceId: service.id,
      isArchived: false,
      label: `Timeline ${index + 1}`,
    }));
    const createdTimelines = await Timeline.bulkCreate(timelines, { returning: true });
    console.log(`✅ Created ${createdTimelines.length} timelines`);

    // 7. Seed Orders (30-60 records)
    console.log("🛒 Seeding Orders...");
    const orderCount = randomInt(30, 60);
    const orders = [];
    const orderStatuses = ["paid", "fulfilled", "completed", "refunded"];

    for (let i = 0; i < orderCount; i++) {
      const service = randomElement(createdServices);
      const timeline = createdTimelines.find(t => t.serviceId === service.id);
      const user = randomElement(createdUsers);
      const status = randomElement(orderStatuses);
      const amount = service.price;

      orders.push({
        userId: user.id,
        serviceId: service.id,
        timelineId: timeline.id,
        amount,
        status,
        currency: "usd",
        stripePaymentIntentId: `pi_test_${uuidv4().replace(/-/g, '')}`,
      });
    }
    await Order.bulkCreate(orders);
    console.log(`✅ Created ${orders.length} orders`);

    // 8. Seed Reviews (50-80 records)
    console.log("⭐ Seeding Reviews...");
    const reviewCount = randomInt(50, 80);
    const reviews = [];
    const usedReviewPairs = new Set(); // Track user-service pairs to avoid duplicates

    for (let i = 0; i < reviewCount; i++) {
      const service = randomElement(createdServices);
      let user;
      let pairKey;
      let attempts = 0;

      // Ensure unique user-service pairs
      do {
        user = randomElement(createdUsers);
        pairKey = `${user.id}-${service.id}`;
        attempts++;
      } while (usedReviewPairs.has(pairKey) && attempts < 50);

      if (attempts >= 50) continue; // Skip if we can't find a unique pair

      usedReviewPairs.add(pairKey);
      const rating = randomInt(1, 5);
      const body = rating >= 3 ? randomElement(reviewBodies) : "Service did not meet expectations.";

      reviews.push({
        userId: user.id,
        serviceId: service.id,
        rating,
        body,
      });
    }
    await Review.bulkCreate(reviews);
    console.log(`✅ Created ${reviews.length} reviews`);

    // 9. Seed Posts (40-70 records)
    console.log("📝 Seeding Posts...");
    const postCount = randomInt(40, 70);
    const posts = [];

    for (let i = 0; i < postCount; i++) {
      const timeline = randomElement(createdTimelines);
      const user = randomElement(createdUsers);
      const hasAttachments = Math.random() > 0.5;

      posts.push({
        userId: user.id,
        timelineId: timeline.id,
        description: randomElement(postDescriptions),
        attachments: hasAttachments ? [
          { name: "image1", url: `https://picsum.photos/seed/${uuidv4()}/800/600` },
          { name: "image2", url: `https://picsum.photos/seed/${uuidv4()}/800/600` },
        ] : null,
      });
    }
    const createdPosts = await Post.bulkCreate(posts, { returning: true });
    console.log(`✅ Created ${createdPosts.length} posts`);

    // 10. Seed Comments (60-100 records)
    console.log("💬 Seeding Comments...");
    const commentCount = randomInt(60, 100);
    const comments = [];
    const topLevelComments = [];

    // First create top-level comments
    for (let i = 0; i < commentCount * 0.7; i++) {
      const post = randomElement(createdPosts);
      const user = randomElement(createdUsers);
      const comment = {
        userId: user.id,
        postId: post.id,
        parentId: null,
        body: randomElement(commentBodies),
      };
      comments.push(comment);
      topLevelComments.push(comment);
    }

    // Then create some reply comments
    for (let i = 0; i < commentCount * 0.3; i++) {
      if (topLevelComments.length === 0) break;
      const parent = randomElement(topLevelComments);
      const user = randomElement(createdUsers);
      comments.push({
        userId: user.id,
        postId: parent.postId,
        parentId: parent.id || topLevelComments[0].id,
        body: randomElement(commentBodies),
      });
    }

    await Comment.bulkCreate(comments);
    console.log(`✅ Created ${comments.length} comments`);

    // 11. Seed Favorites (30-50 records)
    console.log("❤️ Seeding Favorites...");
    const favoriteCount = randomInt(30, 50);
    const favorites = [];
    const usedFavoritePairs = new Set();

    for (let i = 0; i < favoriteCount; i++) {
      const service = randomElement(createdServices);
      let user;
      let pairKey;
      let attempts = 0;

      do {
        user = randomElement(createdUsers);
        pairKey = `${user.id}-${service.id}`;
        attempts++;
      } while (usedFavoritePairs.has(pairKey) && attempts < 50);

      if (attempts >= 50) continue;

      usedFavoritePairs.add(pairKey);
      favorites.push({
        userId: user.id,
        serviceId: service.id,
      });
    }
    await Favorite.bulkCreate(favorites);
    console.log(`✅ Created ${favorites.length} favorites`);

    // 12. Seed Assets (50-80 records)
    console.log("🖼️ Seeding Assets...");
    const assetCount = randomInt(50, 80);
    const assets = [];
    const assetKeys = ["userImage", "serviceProfileImage", "serviceProfileGalleryImage", "postAttachmentsImage"];
    const mediaTypes = ["image", "video", "document"];

    for (let i = 0; i < assetCount; i++) {
      const user = randomElement(createdUsers);
      const key = randomElement(assetKeys);
      const mediaType = randomElement(mediaTypes);
      const isServiceAsset = key.includes("service");
      const isPostAsset = key.includes("post");
      const service = isServiceAsset ? randomElement(createdServices) : null;
      const post = isPostAsset ? randomElement(createdPosts) : null;

      assets.push({
        name: uuidv4(),
        key,
        mediaType,
        userId: user.id,
        serviceProviderId: service ? service.serviceProviderId : null,
        serviceId: service ? service.id : null,
        postId: post ? post.id : null,
        url: `https://picsum.photos/seed/${uuidv4()}/800/600`,
        size: randomInt(100000, 5000000),
        views: randomInt(0, 100),
        thumb: key.includes("Gallery") || key.includes("Image"),
        confirmed: Math.random() > 0.2, // 80% confirmed
      });
    }
    await Asset.bulkCreate(assets);
    console.log(`✅ Created ${assets.length} assets`);

    // 13. Seed Coupons (15-30 records)
    console.log("🎫 Seeding Coupons...");
    const couponCount = randomInt(15, 30);
    const coupons = [];

    for (let i = 0; i < couponCount; i++) {
      const expDate = randomDate(new Date(), new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
      coupons.push({
        couponCode: uuidv4(),
        discount_rate: parseFloat(randomFloat(5, 50).toFixed(2)),
        expDate,
      });
    }
    await Coupon.bulkCreate(coupons);
    console.log(`✅ Created ${coupons.length} coupons`);

    // 14. Seed Notifications (40-60 records)
    console.log("🔔 Seeding Notifications...");
    const notificationCount = randomInt(40, 60);
    const notifications = [];
    const notificationTypes = ["info", "warning", "alert", "system"];

    for (let i = 0; i < notificationCount; i++) {
      const user = randomElement(createdUsers);
      notifications.push({
        userId: user.id,
        message: randomElement(notificationMessages),
        type: randomElement(notificationTypes),
        isRead: Math.random() > 0.5, // 50% read
        url: Math.random() > 0.5 ? `/services/${randomInt(1, serviceCount)}` : null,
        metadata: { source: "test_seed" },
      });
    }
    await Notification.bulkCreate(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    // 15. Seed Events (20-40 records)
    console.log("📊 Seeding Events...");
    const eventCount = randomInt(20, 40);
    const events = [];
    const eventTypes = ["service_created", "service_approved", "order_placed", "review_submitted", "user_registered"];
    const actorTypes = ["admin", "service_provider", "employer"];

    for (let i = 0; i < eventCount; i++) {
      const actorType = randomElement(actorTypes);
      let userActorId, providerActorId;

      if (actorType === "service_provider") {
        const provider = randomElement(createdServiceProviders);
        providerActorId = provider.id;
        userActorId = randomElement(createdUsers).id;
      } else if (actorType === "employer") {
        const employer = randomElement(createdEmployers);
        providerActorId = employer.id;
        userActorId = randomElement(createdUsers).id;
      } else {
        userActorId = randomElement(createdUsers).id;
        providerActorId = null;
      }

      events.push({
        eventType: randomElement(eventTypes),
        userActorId,
        providerActorId,
        actorType,
        metadata: { test: true, timestamp: new Date().toISOString() },
      });
    }
    await Event.bulkCreate(events);
    console.log(`✅ Created ${events.length} events`);

    // 16. Seed Tokens (20-30 records)
    console.log("🔑 Seeding Tokens...");
    const tokenCount = randomInt(20, 30);
    const tokens = [];
    const tokenTypes = ["emailVerification", "passwordReset"];

    for (let i = 0; i < tokenCount; i++) {
      const user = randomElement(createdUsers);
      const type = randomElement(tokenTypes);
      const expiresAt = randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      tokens.push({
        token: `test_token_${uuidv4().replace(/-/g, '')}`,
        userId: user.id,
        type,
        oneTime: Math.random() > 0.5,
        isValid: Math.random() > 0.3, // 70% valid
        expiresAt,
      });
    }
    await Token.bulkCreate(tokens);
    console.log(`✅ Created ${tokens.length} tokens`);

    // 17. Seed Stripe Events (15-25 records)
    console.log("💳 Seeding Stripe Events...");
    const stripeEventCount = randomInt(15, 25);
    const stripeEvents = [];
    const stripeEventTypes = ["payment_intent.succeeded", "payment_intent.failed", "charge.refunded", "customer.created"];

    for (let i = 0; i < stripeEventCount; i++) {
      const type = randomElement(stripeEventTypes);
      const status = Math.random() > 0.3 ? "processed" : "pending";

      stripeEvents.push({
        id: `evt_test_${uuidv4().replace(/-/g, '')}`,
        type,
        objectId: `pi_test_${uuidv4().replace(/-/g, '')}`,
        status,
        payload: {
          type,
          data: {
            object: {
              id: `pi_test_${uuidv4().replace(/-/g, '')}`,
              amount: randomInt(1000, 50000),
              currency: "usd",
            },
          },
        },
      });
    }
    await StripeEvent.bulkCreate(stripeEvents);
    console.log(`✅ Created ${stripeEvents.length} stripe events`);

    console.log("\n🎉 Test data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Service Providers: ${createdServiceProviders.length}`);
    console.log(`   - Employers: ${createdEmployers.length}`);
    console.log(`   - Services: ${createdServices.length}`);
    console.log(`   - Timelines: ${createdTimelines.length}`);
    console.log(`   - Orders: ${orders.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Posts: ${createdPosts.length}`);
    console.log(`   - Comments: ${comments.length}`);
    console.log(`   - Favorites: ${favorites.length}`);
    console.log(`   - Assets: ${assets.length}`);
    console.log(`   - Coupons: ${coupons.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Tokens: ${tokens.length}`);
    console.log(`   - Stripe Events: ${stripeEvents.length}`);

  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  }
}
