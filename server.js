const express = require("express");
const fs = require("node:fs");
const path = require("node:path");

const app = express();
const port = process.env.PORT || 3000;
const dataPath = path.join(__dirname, "data", "resources.json");

function loadResources() {
    try {
        const resources = JSON.parse(fs.readFileSync(dataPath, "utf8"));

        if (!Array.isArray(resources)) {
            throw new Error("The resource dataset must be an array.");
        }

        return resources;
    } catch (error) {
        throw new Error(`Could not load ${dataPath}: ${error.message}`);
    }
}

const resources = loadResources();
const guides = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "guides.json"), "utf8"));
const postalAreas = {
    M1: "Scarborough", M2: "North York", M3: "North York", M4: "Toronto",
    M5: "Toronto", M6: "Toronto", M8: "Etobicoke", M9: "Etobicoke"
};

function guideFor(category) {
    return guides[category] || guides.All;
}

// Matches Part 1: a valid Toronto postal code is turned into a service area.
function areaFromPostalCode(postalCode) {
    const postal = String(postalCode || "").toUpperCase().replace(/\s/g, "");

    if (!postal) {
        return { area: "" };
    }

    if (!/^M\d[A-Z]\d[A-Z]\d$/.test(postal)) {
        return { error: "Enter a Toronto postal code, for example M5V 2T6, or leave it blank." };
    }

    return { area: postalAreas[postal.slice(0, 2)] || "Toronto" };
}

function normalized(value) {
    return String(value || "").trim().toLowerCase();
}

// Same category keywords as the Part 1 prototype, so a service can match more than one need.
const categoryTerms = {
    Employment: ["employment", "career", "job"],
    Language: ["language", "english class", "esl"],
    Housing: ["housing", "shelter"],
    Healthcare: ["health", "medical"],
    DriversLicence: ["driver", "driver's licence", "drivers licence", "driver licence", "photo id", "serviceontario"],
    Taxes: ["tax", "income tax", "tax return", "cra"],
    SocialInsuranceNumber: ["social insurance number"]
};

function matchesCategory(resource, category) {
    const key = Object.keys(categoryTerms).find((name) => name.toLowerCase() === category);

    if (!key) {
        return normalized(resource.category) === category;
    }

    const serviceText = `${resource.name} ${resource.description} ${resource.eligibility}`.toLowerCase();
    return categoryTerms[key].some((term) => serviceText.includes(term));
}

function filterResources(records, options) {
    const keyword = normalized(options.keyword);
    const category = normalized(options.category);
    const language = normalized(options.language);
    const area = normalized(options.area);
    const sort = normalized(options.sort);

    const filtered = records.filter((resource) => {
        const searchableText = [
            resource.name,
            resource.category,
            resource.description,
            resource.eligibility,
            resource.location.municipality,
            resource.location.neighbourhood,
            ...resource.languages
        ].join(" ").toLowerCase();

        return (!keyword || searchableText.includes(keyword)) &&
            (!category || matchesCategory(resource, category)) &&
            (!language || resource.languages.some((item) => normalized(item).includes(language))) &&
            (!area || `${resource.location.municipality} ${resource.location.neighbourhood}`.toLowerCase().includes(area));
    });

    if (sort === "name") {
        return filtered.sort((first, second) => first.name.localeCompare(second.name));
    }

    return filtered;
}

function findResource(id) {
    return resources.find((resource) => resource.id === id);
}

function searchOptions() {
    return {
        categories: Object.keys(guides).filter((key) => key !== "All"),
        guides,
        languages: [...new Set(resources.flatMap((resource) => resource.languages))].sort(),
        areas: [...new Set(resources.map((resource) => resource.location.municipality))].sort()
    };
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (request, response) => {
    response.render("home", { resourceCount: resources.length });
});

app.get("/api/resources", (request, response) => {
    const results = filterResources(resources, request.query);
    response.json({ count: results.length, resources: results });
});

app.get("/api/resources/:id", (request, response) => {
    const resource = findResource(request.params.id);

    if (!resource) {
        response.status(404).json({ error: "Resource not found." });
        return;
    }

    response.json(resource);
});

app.get("/api/search", (request, response) => {
    if (!normalized(request.query.keyword)) {
        response.status(400).json({ error: "A keyword query parameter is required." });
        return;
    }

    const results = filterResources(resources, request.query);
    response.json({ keyword: request.query.keyword.trim(), count: results.length, resources: results });
});

app.get("/resources", (request, response) => {
    response.render("resources", {
        resources: filterResources(resources, request.query),
        filters: request.query,
        guide: guideFor(request.query.category),
        ...searchOptions()
    });
});

app.get("/resources/:id", (request, response, next) => {
    const resource = findResource(request.params.id);

    if (!resource) {
        next();
        return;
    }

    response.render("resource-detail", { resource, guide: guideFor(resource.category) });
});

app.get("/search", (request, response) => {
    response.render("search", {
        filters: {},
        results: null,
        error: null,
        guide: guideFor(""),
        ...searchOptions()
    });
});

app.post("/search", (request, response) => {
    const filters = { ...request.body, keyword: String(request.body.keyword || "").trim() };
    const location = areaFromPostalCode(filters.postalCode);
    const error = filters.mode === "keyword" && !filters.keyword
        ? "Please enter a keyword to search for a service."
        : location.error;

    if (error) {
        response.status(400).render("search", {
            filters,
            results: null,
            error,
            guide: guideFor(filters.category),
            ...searchOptions()
        });
        return;
    }

    response.render("search", {
        filters,
        results: filterResources(resources, { ...filters, area: location.area }),
        area: location.area,
        error: null,
        guide: guideFor(filters.category),
        ...searchOptions()
    });
});

app.use((request, response) => {
    if (request.path.startsWith("/api/")) {
        response.status(404).json({ error: "API route not found." });
        return;
    }

    response.status(404).render("404");
});

app.listen(port, () => {
    console.log(`NewStart is running at http://localhost:${port}`);
});
