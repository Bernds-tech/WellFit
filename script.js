const flavorMap = {
  berry: {
    name: "Berry Boost",
    start: "#d64ca8",
    end: "#7b57f1",
    basePrice: 29.9,
  },
  citrus: {
    name: "Citrus Focus",
    start: "#f7a81a",
    end: "#f56f46",
    basePrice: 27.9,
  },
  mint: {
    name: "Mint Recovery",
    start: "#24b97a",
    end: "#2d7bf0",
    basePrice: 31.9,
  },
};

const sizeFactor = {
  "300g": 1,
  "600g": 1.75,
};

const form = document.getElementById("preview-form");
const visual = document.getElementById("product-visual");
const visualLabel = document.getElementById("visual-label");
const summaryName = document.getElementById("summary-name");
const summarySize = document.getElementById("summary-size");
const summaryPlan = document.getElementById("summary-plan");
const summaryPrice = document.getElementById("summary-price");
const subscriptionCheckbox = document.getElementById("subscription");

const formatPrice = (value) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);

function updatePreview() {
  const flavor = flavorMap[form.flavor.value];
  const size = form.elements.size.value;
  const hasSubscription = subscriptionCheckbox.checked;

  const planLabel = hasSubscription ? "Abo (monatlich)" : "Einmalkauf";
  let total = flavor.basePrice * sizeFactor[size];

  if (hasSubscription) {
    total *= 0.9;
  }

  visual.style.setProperty("--flavor-start", flavor.start);
  visual.style.setProperty("--flavor-end", flavor.end);
  visualLabel.textContent = flavor.name;
  summaryName.textContent = flavor.name;
  summarySize.textContent = size;
  summaryPlan.textContent = planLabel;
  summaryPrice.textContent = formatPrice(total);
}

form.addEventListener("input", updatePreview);
updatePreview();
