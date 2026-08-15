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
const DISCOUNT_RATE = 0.1;

const form = document.getElementById("preview-form");
const visual = document.getElementById("product-visual");
const visualLabel = document.getElementById("visual-label");
const summaryName = document.getElementById("summary-name");
const summarySize = document.getElementById("summary-size");
const summaryPlan = document.getElementById("summary-plan");
const summaryPrice = document.getElementById("summary-price");
const subscriptionCheckbox = document.getElementById("subscription");
const discountRate = document.getElementById("discount-rate");

const formatPrice = (value) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);

function updatePreview() {
  const flavor = flavorMap[form.flavor.value] ?? flavorMap.berry;
  const selectedSize = form.elements.size.value;
  const isKnownSize = Object.prototype.hasOwnProperty.call(sizeFactor, selectedSize);

  if (!isKnownSize) {
    console.warn(`Unknown size "${selectedSize}", falling back to 300g.`);
  }
  const size = isKnownSize ? selectedSize : "300g";
  const factor = sizeFactor[size];
  const hasSubscription = subscriptionCheckbox.checked;

  const planLabel = hasSubscription ? "Abo (monatlich)" : "Einmalkauf";
  let total = flavor.basePrice * factor;

  if (hasSubscription) {
    total *= 1 - DISCOUNT_RATE;
  }

  visual.style.setProperty("--flavor-start", flavor.start);
  visual.style.setProperty("--flavor-end", flavor.end);
  visualLabel.textContent = flavor.name;
  summaryName.textContent = flavor.name;
  summarySize.textContent = size;
  summaryPlan.textContent = planLabel;
  summaryPrice.textContent = formatPrice(total);
}

if (discountRate) {
  discountRate.textContent = `${Math.round(DISCOUNT_RATE * 100)}%`;
}

form.addEventListener("input", updatePreview);
updatePreview();
