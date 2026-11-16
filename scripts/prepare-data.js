const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");

const sourceUrl = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search?resource_id=7298a558-16f6-4477-ada8-29a1c848aebe&limit=1000";
const outputPath = path.join(__dirname, "..", "data", "resources.json");

function requestJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let body = "";

            response.setEncoding("utf8");
            response.on("data", (chunk) => {
                body += chunk;
            });
            response.on("end", () => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Dataset request failed with status ${response.statusCode}.`));
                    return;
                }

                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(new Error(`Dataset response was not valid JSON: ${error.message}`));
                }
            });
        }).on("error", (error) => {
            reject(new Error(`Could not download the dataset: ${error.message}`));
        });
    });
}

function cleanText(value) {
    const text = String(value || "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

    return text || "Not available";
}

function websiteUrl(value) {
    const match = String(value || "").match(/href="([^"]+)"/i);
    return match ? match[1] : "Not available";
}

function languages(value) {
    const cleaned = cleanText(value);

    return cleaned === "Not available"
        ? []
        : cleaned.split(";").map((language) => language.trim()).filter(Boolean);
}

function chooseCategory(searchText) {
    const categories = [
        ["DriversLicence", ["driver", "photo id", "serviceontario"]],
        ["Taxes", ["tax", "income tax", "tax return", "cra"]],
        ["SocialInsuranceNumber", ["social insurance number", "sin"]],
        ["Employment", ["employment", "career", "job", "workplace"]],
        ["Language", ["language", "esl", "english class"]],
        ["Housing", ["housing", "shelter", "tenant"]],
        ["Healthcare", ["health", "medical", "mental health", "ohip"]]
    ];

    const match = categories.find(([, terms]) => terms.some((term) => searchText.includes(term)));
    return match ? match[0] : "Settlement";
}

function prepareRecord(record) {
    const name = cleanText(record.AGENCY_NAME);
    const description = cleanText(record.DESCRIPTION_SERVICE);
    const eligibility = cleanText(record.ELIGIBILITY);
    const recordLanguages = languages(record.LANGUAGES);
    const searchText = `${name} ${description} ${eligibility} ${recordLanguages.join(" ")}`.toLowerCase();
    const category = chooseCategory(searchText);

    return {
        id: `resource-${record._id}`,
        sourceId: record._id,
        name,
        category,
        description,
        eligibility,
        languages: recordLanguages,
        tags: [category.toLowerCase(), "newcomer-support"],
        location: {
            address: cleanText(record.ADDRESS_FULL || record.ORGANIZATION_ADDRESS),
            municipality: cleanText(record.MUNICIPALITY),
            neighbourhood: cleanText(record.NEIGHBOURHOOD),
            postalCode: cleanText(record.POSTAL_CODE),
            latitude: record.LATITUDE || null,
            longitude: record.LONGITUDE || null
        },
        contact: {
            phone: cleanText(record.OFFICE_PHONE),
            email: cleanText(record.EMAIL),
            website: websiteUrl(record.WEBSITE)
        },
        hours: cleanText(record.HOURS),
        accessibility: cleanText(record.ACCESSIBILITY),
        sourceUpdated: cleanText(record.DATE_UPDATED)
    };
}

async function main() {
    const source = await requestJson(sourceUrl);
    const resources = source.result.records.map(prepareRecord);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(resources, null, 2)}\n`);
    console.log(`Prepared ${resources.length} resource records in ${outputPath}.`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
