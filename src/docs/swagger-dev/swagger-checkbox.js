function addCheckboxes() {
  const blocks = document.querySelectorAll(".opblock");
  if (!blocks.length) return setTimeout(addCheckboxes, 100);
  blocks.forEach((op) => {
    const id = op.querySelector(".opblock-summary-path")?.innerText;
    if (!id) return;
    const key = "swagger-reviewed-" + id;
    const checked = localStorage.getItem(key) === "true";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = checked;
    box.style = { "margin-left": "8px", width: "55px" };
    box.onchange = () => localStorage.setItem(key, box.checked);
    op.querySelector(".opblock-summary").prepend(box);
  });
}

window.addEventListener("load", addCheckboxes);
