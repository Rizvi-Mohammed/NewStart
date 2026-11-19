
const fs = require("node:fs");
const path = require("node:path");

// Path to the JSON dataset
const dataPath = path.join(__dirname, "..", "data", "resources.json");

// The 8 allowed categories
const allowedCategories = [
    "Employment",
    "Language",
    "Housing",
    "Healthcare",
    "Settlement",
    "DriversLicence",
    "Taxes",
    "SocialInsuranceNumber"
];

let errors = [];
let warnings = [];

console.log("\n==================================");
console.log(" NewStart JSON Data Validation");
console.log("==================================\n");

// 1. Check whether the JSON file exists
if (!fs.existsSync(dataPath)) {
    console.error("FAIL: resources.json file was not found.");
    process.exit(1);
}

console.log("PASS: resources.json file found.");

// 2. Read and parse JSON
let resources;

try {
    const fileContent = fs.readFileSync(dataPath, "utf8");
    resources = JSON.parse(fileContent);

    console.log("PASS: JSON file contains valid JSON.");
} catch (error) {
    console.error("FAIL: Could not read or parse JSON.");
    console.error(error.message);
    process.exit(1);
}

// 3. Check that the dataset is an array
if (!Array.isArray(resources)) {
    console.error("FAIL: Dataset must be an array.");
    process.exit(1);
}

console.log("PASS: Dataset is an array.");

// 4. Check that the dataset is not empty
if (resources.length === 0) {
    errors.push("Dataset contains no resource records.");
}

// 5. Validate individual resource records
const requiredFields = [
    "id",
    "name",
    "category",
    "description"
];

const usedIDs = new Set();

resources.forEach((resource, index) => {
    const recordNumber = index + 1;

    if (
        resource === null ||
        typeof resource !== "object" ||
        Array.isArray(resource)
    ) {
        errors.push(`Record ${recordNumber}: Must be an object.`);
        return;
    }

    // Check required fields
    requiredFields.forEach((field) => {
        if (
            resource[field] === undefined ||
            resource[field] === null ||
            String(resource[field]).trim() === ""
        ) {
            errors.push(
                `Record ${recordNumber}: Missing or empty field '${field}'.`
            );
        }
    });

    // Check unique IDs
    if (resource.id !== undefined && resource.id !== null) {
        if (usedIDs.has(resource.id)) {
            errors.push(
                `Record ${recordNumber}: Duplicate ID '${resource.id}'.`
            );
        } else {
            usedIDs.add(resource.id);
        }
    }

    // Check languages array
    if (!Array.isArray(resource.languages)) {
        errors.push(
            `Record ${recordNumber}: languages must be an array.`
        );
    }

    // Check tags array
    if (!Array.isArray(resource.tags)) {
        errors.push(
            `Record ${recordNumber}: tags must be an array.`
        );
    }

    // Check location object
    if (
        typeof resource.location !== "object" ||
        resource.location === null ||
        Array.isArray(resource.location)
    ) {
        errors.push(
            `Record ${recordNumber}: location must be an object.`
        );
    }

    // Check contact object
    if (
        typeof resource.contact !== "object" ||
        resource.contact === null ||
        Array.isArray(resource.contact)
    ) {
        errors.push(
            `Record ${recordNumber}: contact must be an object.`
        );
    }

    // Check allowed categories
    if (
        typeof resource.category === "string" &&
        resource.category.trim() !== "" &&
        !allowedCategories.some(
            category =>
                category.toLowerCase() === resource.category.trim().toLowerCase()
        )
    ) {
        errors.push(
            `Record ${recordNumber}: Invalid category '${resource.category}'.`
        );
    }
});

// 6. Print validation summary
console.log("\n==================================");
console.log(" VALIDATION SUMMARY");
console.log("==================================");

console.log(`Total records: ${resources.length}`);
console.log(`Unique IDs: ${usedIDs.size}`);
console.log(`Errors found: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) {
    console.log("\nVALIDATION FAILED!");

    errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
    });

    process.exitCode = 1;
} else {
    console.log("\nVALIDATION PASSED!");
    console.log("All resource records passed validation.");
}

console.log("==================================\n");
