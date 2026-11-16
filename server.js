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

function normalized(value) {
    return String(value || "").trim().toLowerCase();
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
            (!category || normalized(resource.category) === category) &&
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
        categories: [...new Set(resources.map((resource) => resource.category))].sort(),
        languages: [...new Set(resources.flatMap((resource) => resource.languages))].sort(),
        areas: [...new Set(resources.map((resource) => resource.location.municipality))].sort()
    };
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));

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
        ...searchOptions()
    });
});

app.get("/resources/:id", (request, response, next) => {
    const resource = findResource(request.params.id);

    if (!resource) {
        next();
        return;
    }

    response.render("resource-detail", { resource });
});

app.get("/search", (request, response) => {
    response.render("search", {
        filters: {},
        results: null,
        error: null,
        ...searchOptions()
    });
});

app.post("/search", (request, response) => {
    const keyword = String(request.body.keyword || "").trim();

    if (!keyword) {
        response.status(400).render("search", {
            filters: request.body,
            results: null,
            error: "Please enter a keyword to search for a service.",
            ...searchOptions()
        });
        return;
    }

    response.render("search", {
        filters: request.body,
        results: filterResources(resources, request.body),
        error: null,
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
