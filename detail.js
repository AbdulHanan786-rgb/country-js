const loader = document.querySelector("#Loader");
const detailsContainer = document.querySelector("#details-container");
const themeToggle = document.querySelector("#themeToggle");

themeToggle?.addEventListener("click", function () {
  document.documentElement.classList.toggle("dark");
});

function getCountryName(country) {
  return typeof country.name === "string"
    ? country.name
    : country.name?.common || "";
}

function setText(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent =
      value !== undefined && value !== null && value !== "" ? value : "N/A";
  }
}

async function getCountryDetails() {
  if (!loader || !detailsContainer) {
    console.error("Loader ya details-container HTML mein missing hai.");
    return;
  }

  const params = new URLSearchParams(window.location.search);

  const rawCode = params.get("code")?.trim() || "";

  const code = /^(undefined|null)$/i.test(rawCode) ? "" : rawCode.toUpperCase();

  const name = params.get("name")?.trim().toLowerCase() || "";

  loader.classList.remove("hidden");
  detailsContainer.classList.add("hidden");

  if (!code && !name) {
    loader.textContent =
      "Country ka naam/code missing hai. Main page se View Details click karein.";
    return;
  }

  loader.textContent = "Loading country details...";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://countries.dev/countries", {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("API Error: " + response.status);
    }

    const countries = await response.json();

    if (!Array.isArray(countries)) {
      throw new Error("API se countries ki list nahi mili.");
    }

    let country = code
      ? countries.find(function (item) {
          const codes = [
            item.alpha2Code,
            item.alpha3Code,
            item.cca2,
            item.cca3,
          ];

          return codes.some(function (value) {
            return typeof value === "string" && value.toUpperCase() === code;
          });
        })
      : undefined;

    if (!country && name) {
      country = countries.find(function (item) {
        return getCountryName(item).toLowerCase() === name;
      });
    }

    if (!country) {
      throw new Error("Selected country ka data nahi mila.");
    }

    const countryName = getCountryName(country);

    setText("#countryName", countryName);

    setText("#officialName", "Loading...");

    try {
      const officialResponse = await fetch(
        "https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json",
        { signal: controller.signal },
      );

      if (!officialResponse.ok) {
        throw new Error("Official names load nahi hue.");
      }

      const officialCountries = await officialResponse.json();

      const alpha2 = (country.alpha2Code || country.cca2 || "").toUpperCase();

      const alpha3 = (country.alpha3Code || country.cca3 || "").toUpperCase();

      const officialCountry = officialCountries.find(function (item) {
        return (
          (alpha2 && item.cca2 === alpha2) ||
          (alpha3 && item.cca3 === alpha3) ||
          item.name.common.toLowerCase() === countryName.toLowerCase()
        );
      });

      setText("#officialName", officialCountry?.name?.official);
    } catch (error) {
      setText("#officialName", "Unavailable");
      console.error("Official Name Error:", error);
    }

    setText(
      "#countryCapital",
      Array.isArray(country.capital)
        ? country.capital.join(", ")
        : country.capital,
    );

    setText("#countryRegion", country.region);

    setText("#countrySubRegion", country.subregion);

    setText(
      "#countryPopulation",
      country.population != null
        ? Number(country.population).toLocaleString("en-US")
        : "N/A",
    );

    // Added: country area.
    setText(
      "#countryArea",
      country.area != null
        ? Number(country.area).toLocaleString("en-US") + " km²"
        : "N/A",
    );

    setText(
      "#countryCode",
      country.alpha3Code || country.cca3 || country.alpha2Code || country.cca2,
    );

    const flag = document.querySelector("#countryFlag");
    const flagURL = country.flags?.svg || country.flags?.png;

    if (flag) {
      flag.alt = `Flag of ${countryName}`;

      if (flagURL) {
        flag.src = flagURL;
        flag.classList.remove("hidden");
      } else {
        flag.removeAttribute("src");
        flag.classList.add("hidden");
      }
    }

    document.title = `${countryName} | Country Details`;

    loader.classList.add("hidden");
    detailsContainer.classList.remove("hidden");
  } catch (error) {
    loader.textContent =
      error.name === "AbortError"
        ? "API ne 15 seconds mein response nahi diya. Dobara try karein."
        : "Error: " + error.message;

    console.error("Details Error:", error);
  } finally {
    clearTimeout(timeout);
  }
}

getCountryDetails();