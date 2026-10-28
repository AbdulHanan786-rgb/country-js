const container = document.querySelector("#countryContainer");
const search = document.querySelector("#searchInput");
const count = document.querySelector("#countryCount");
const pages = document.querySelector("#pageButtons");

const regionButton = document.querySelector("#regionToggle");
const regionMenu = document.querySelector("#regionMenu");
const regionLabel = document.querySelector("#selectedRegion");

let countries = [];
let currentPage = 1;
let selectedRegion = "";

const perPage = 12;

function safe(value) {
  const characters = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  return String(value ?? "").replace(
    /[&<>"']/g,
    char => characters[char]
  );
}

async function loadCountries() {
  container.textContent = "Loading countries...";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://countries.dev/countries", {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("API Error: " + response.status);
    }

    countries = await response.json();

    if (!Array.isArray(countries)) {
      throw new Error("Invalid country data.");
    }

    showRegions();
    showCountries();
  } catch (error) {
    container.textContent =
      error.name === "AbortError"
        ? "Request timeout. Page refresh karein."
        : error.message;
  } finally {
    clearTimeout(timer);
  }
}

function filteredCountries() {
  return countries.filter(country =>
    country.name.toLowerCase().includes(search.value.trim().toLowerCase()) &&
    (!selectedRegion || country.region === selectedRegion)
  );
}

function showCountries() {
  const filtered = filteredCountries();
  const start = (currentPage - 1) * perPage;

  if (count) count.textContent = filtered.length;

  container.innerHTML = filtered
    .slice(start, start + perPage)
    .map(country => {
      const code =
        country.alpha2Code || country.cca2 ||
        country.alpha3Code || country.cca3 || "";

      const link = `detail.html?code=${encodeURIComponent(code)}&name=${encodeURIComponent(country.name)}`;

      const capital = Array.isArray(country.capital)
        ? country.capital.join(", ")
        : country.capital;

      const flag = country.flags?.svg || country.flags?.png;

      return `
        <div class="w-72 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          ${
            flag
              ? `<img src="${safe(flag)}" alt="${safe(country.name)} Flag"
                   class="w-full h-48 object-cover" loading="lazy">`
              : `<div class="h-48 bg-gray-200 flex items-center justify-center">
                   Flag unavailable
                 </div>`
          }

          <div class="p-6 space-y-3 flex flex-col flex-1">
            <h2 class="text-lg font-bold">${safe(country.name)}</h2>

            <p><b>Capital:</b> ${safe(capital || "N/A")}</p>
            <p><b>Region:</b> ${safe(country.region || "N/A")}</p>
            <p><b>Population:</b> ${
              country.population != null
                ? Number(country.population).toLocaleString("en-US")
                : "N/A"
            }</p>

            <a href="${safe(link)}"
               class="block w-48 bg-slate-900 ml-6 text-white text-center py-2 rounded-lg hover:bg-slate-700">
              View Details
            </a>
          </div>
        </div>
      `;
    })
    .join("");

  if (!filtered.length) {
    container.textContent = "No countries found.";
  }

  showPages(filtered.length);
}

function showPages(total) {
  if (!pages) return;

  pages.replaceChildren();

  for (let i = 1; i <= Math.ceil(total / perPage); i++) {
    const button = document.createElement("button");

    button.textContent = i;
    button.className = `px-4 py-2 rounded text-black ${
      i === currentPage ? "bg-white font-bold" : "bg-cyan-300"
    }`;

    button.onclick = () => {
      currentPage = i;
      showCountries();
    };

    pages.appendChild(button);
  }
}

function toggleMenu(open) {
  if (!regionMenu || !regionButton) return;

  regionMenu.classList.toggle("hidden", !open);
  regionButton.setAttribute("aria-expanded", String(open));
}

function showRegions() {
  if (!regionMenu) return;

  const regions = [
    "",
    ...[...new Set(countries.map(country => country.region))]
      .filter(Boolean)
      .sort()
  ];

  regionMenu.replaceChildren();

  regions.forEach(region => {
    const button = document.createElement("button");

    button.textContent = region || "All Regions";
    button.className =
      "block w-full px-4 py-3 text-left text-black hover:bg-cyan-100";

    button.onclick = () => {
      selectedRegion = region;
      currentPage = 1;

      if (regionLabel) {
        regionLabel.textContent = region || "All Regions";
      }

      toggleMenu(false);
      showCountries();
    };

    regionMenu.appendChild(button);
  });
}

search.addEventListener("input", () => {
  currentPage = 1;
  showCountries();
});

regionButton?.addEventListener("click", () => {
  toggleMenu(regionMenu?.classList.contains("hidden"));
});

document.addEventListener("click", event => {
  if (
    regionButton && regionMenu &&
    !regionButton.contains(event.target) &&
    !regionMenu.contains(event.target)
  ) {
    toggleMenu(false);
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") toggleMenu(false);
});

const lastButton = document.querySelector("#lastBtn");
if (lastButton) lastButton.style.display = "none";

loadCountries();