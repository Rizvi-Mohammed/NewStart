const get = function (id) {
    return document.getElementById(id);
};

const language = get("language");
const category = get("category");
const postalCode = get("postalCode");
const ageGroup = get("ageGroup");
const areaHint = get("areaHint");
const questionFlow = get("questionFlow");
const results = get("results");
const summary = get("summary");
const helpNote = get("helpNote");
const resourceList = get("resourceList");
const categoryGuide = get("categoryGuide");
const steps = [get("languageStep"), get("categoryStep"), get("locationStep"), get("ageStep")];
const torontoApi = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search?resource_id=7298a558-16f6-4477-ada8-29a1c848aebe&limit=1000";

const newcomerGuides = {
    All: {
        title: "A useful first-week checklist",
        tips: ["Keep your passport, immigration documents, and important account numbers in one secure place.", "Ask each organization about eligibility, fees, language support, and what documents to bring."],
        links: [{ label: "Ontario newcomer services", url: "https://www.ontario.ca/page/settlement-services-newcomers-ontario" }]
    },
    Employment: {
        title: "Before you start applying",
        tips: ["Bring a resume and any work or education documents you have.", "Ask about credential recognition, free job-search workshops, and interview practice."],
        links: [{ label: "Find job and career services", url: "https://www.ontario.ca/page/get-help-finding-job" }]
    },
    Language: {
        title: "Language-learning tip",
        tips: ["Ask whether an assessment is needed before classes begin.", "Check for childcare, evening classes, and online options if those would help."],
        links: [{ label: "Language training for newcomers", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/new-life-canada/improve-english-french/classes.html" }]
    },
    Housing: {
        title: "Housing search reminder",
        tips: ["Do not send money before seeing a rental and reviewing the agreement.", "Keep records of payments and ask about tenant rights before signing."],
        links: [{ label: "Ontario rental rules", url: "https://www.ontario.ca/page/renting-ontario-your-rights" }]
    },
    Healthcare: {
        title: "Getting health support",
        tips: ["Ask a service provider what health coverage or documents are needed.", "For urgent medical help, call 911. For non-emergency health advice in Ontario, call 811."],
        links: [{ label: "Ontario health care for newcomers", url: "https://www.ontario.ca/page/apply-ohip-and-get-health-card" }]
    },
    Settlement: {
        title: "Settling in Toronto",
        tips: ["Settlement workers can help you understand forms, services, and local programs.", "Bring questions about school, health care, employment, housing, and community connections."],
        links: [{ label: "Settlement services in Ontario", url: "https://www.ontario.ca/page/settlement-services-newcomers-ontario" }]
    },
    DriversLicence: {
        title: "Ontario driver's licence and photo ID",
        tips: ["A driver's licence is not the only Ontario photo ID option. Check which document fits your situation before visiting ServiceOntario.", "Bring original identity and immigration documents, and confirm the exact requirements for your licence class before you go."],
        links: [{ label: "ServiceOntario: driver's licence and photo ID", url: "https://www.ontario.ca/page/get-g-drivers-licence-new-drivers" }]
    },
    Taxes: {
        title: "Taxes and tax returns",
        tips: ["Keep records of income, rent, tuition, and other receipts that may be useful when filing.", "Free tax clinics may be available if you have a modest income and a simple tax situation."],
        links: [{ label: "CRA: taxes for newcomers", url: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/segments/newcomers-canada.html" }]
    },
    SocialInsuranceNumber: {
        title: "Social Insurance Number (SIN)",
        tips: ["A SIN is needed to work in Canada and receive some government programs and benefits.", "Keep your SIN private. Do not share it unless an organization has a legitimate legal reason to request it."],
        links: [{ label: "Service Canada: Social Insurance Number", url: "https://www.canada.ca/en/employment-social-development/services/sin.html" }]
    }
};

const categoryTerms = {
    Employment: ["employment", "career", "job"],
    Language: ["language", "english class", "esl"],
    Housing: ["housing", "shelter"],
    Healthcare: ["health", "medical"],
    DriversLicence: ["driver", "driver's licence", "drivers licence", "driver licence", "photo id", "serviceontario"],
    Taxes: ["tax", "income tax", "tax return", "cra"],
    SocialInsuranceNumber: ["social insurance number"],
    Settlement: []
};

function clean(value) {
    return String(value || "Not available").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function chooseCategory(service) {
    const words = service.searchText;

    if (categoryTerms.DriversLicence.some(function (term) { return words.includes(term); })) return "DriversLicence";
    if (categoryTerms.Taxes.some(function (term) { return words.includes(term); })) return "Taxes";
    if (categoryTerms.SocialInsuranceNumber.some(function (term) { return words.includes(term); })) return "SocialInsuranceNumber";
    if (categoryTerms.Employment.some(function (term) { return words.includes(term); })) return "Employment";
    if (categoryTerms.Language.some(function (term) { return words.includes(term); })) return "Language";
    if (categoryTerms.Housing.some(function (term) { return words.includes(term); })) return "Housing";
    if (categoryTerms.Healthcare.some(function (term) { return words.includes(term); })) return "Healthcare";
    return "Settlement";
}

function matchesCategory(service) {
    if (category.value === "All" || category.value === "Settlement") return category.value === "All" || service.category === "Settlement";
    return categoryTerms[category.value].some(function (term) { return service.searchText.includes(term); });
}

async function getServices() {
    const data = await getTorontoData();
    return data.result.records.map(function (record) {
        const service = {
            id: record._id,
            name: clean(record.AGENCY_NAME),
            area: clean(record.MUNICIPALITY),
            languages: clean(record.LANGUAGES),
            description: clean(record.DESCRIPTION_SERVICE),
            eligibility: clean(record.ELIGIBILITY),
            address: clean(record.ORGANIZATION_ADDRESS),
            phone: clean(record.OFFICE_PHONE),
            hours: clean(record.HOURS)
        };

        service.searchText = `${service.name} ${service.description} ${service.eligibility}`.toLowerCase();
        service.category = chooseCategory(service);
        return service;
    });
}

function getTorontoData() {
    return new Promise(function (resolve, reject) {
        const callbackName = `torontoData${Date.now()}`;
        const script = document.createElement("script");
        const timeout = setTimeout(function () {
            cleanUp();
            reject(new Error("Toronto service data timed out."));
        }, 8000);

        function cleanUp() {
            clearTimeout(timeout);
            script.remove();
            delete window[callbackName];
        }

        window[callbackName] = function (data) {
            cleanUp();
            resolve(data);
        };

        script.onerror = function () {
            cleanUp();
            reject(new Error("Toronto service data is unavailable."));
        };
        script.src = `${torontoApi}&callback=${callbackName}`;
        document.head.append(script);
    });
}

function postalInfo() {
    const postal = postalCode.value.toUpperCase().replace(/\s/g, "");
    const areas = {
        M1: "Scarborough", M2: "North York", M3: "North York", M4: "Toronto",
        M5: "Toronto", M6: "Toronto", M8: "Etobicoke", M9: "Etobicoke"
    };

    if (!/^M\d[A-Z]\d[A-Z]\d$/.test(postal)) {
        return { area: "All", message: "Enter a Toronto postal code, for example M5V 2T6. We will use it to suggest a service area." };
    }

    const area = areas[postal.slice(0, 2)] || "Toronto";
    return { area, message: `We will prioritize services in ${area}.` };
}

function addText(parent, text, className) {
    const paragraph = document.createElement("p");
    if (className) paragraph.className = className;

    String(text).split(/(\*\*[^*]+\*\*)/g).forEach(function (part) {
        if (part.startsWith("**") && part.endsWith("**")) {
            const bold = document.createElement("strong");
            bold.textContent = part.slice(2, -2);
            paragraph.append(bold);
        } else {
            paragraph.append(document.createTextNode(part));
        }
    });

    parent.append(paragraph);
}

function addBadge(parent, text, className) {
    const badge = document.createElement("span");
    badge.className = `badge ${className || ""}`;
    badge.textContent = text;
    parent.append(badge);
}

function renderCategoryGuide(container) {
    const guide = newcomerGuides[category.value] || newcomerGuides.All;
    const title = document.createElement("h3");
    const intro = document.createElement("p");
    const tipList = document.createElement("ul");
    const linkList = document.createElement("div");

    container.innerHTML = "";
    title.textContent = guide.title;
    intro.textContent = "A few practical things to keep in mind:";
    linkList.className = "guide-links";

    guide.tips.forEach(function (tip) {
        const item = document.createElement("li");
        item.textContent = tip;
        tipList.append(item);
    });

    guide.links.forEach(function (link) {
        const anchor = document.createElement("a");
        anchor.href = link.url;
        anchor.rel = "noreferrer";
        anchor.target = "_blank";
        anchor.textContent = link.label;
        linkList.append(anchor);
    });

    container.append(title, intro, tipList, linkList);
}

function addTravelSection(card) {
    const section = document.createElement("div");
    const button = document.createElement("button");
    const panel = document.createElement("div");

    section.className = "travel-section";
    button.className = "map-button";
    button.type = "button";
    button.textContent = "Map and directions (coming later)";
    panel.className = "travel-panel";
    panel.hidden = true;

    button.addEventListener("click", function () {
        panel.hidden = !panel.hidden;
        button.textContent = panel.hidden ? "Map and directions (coming later)" : "Hide map placeholder";

        if (!panel.hasChildNodes()) {
            const times = document.createElement("div");
            const map = document.createElement("div");
            const note = document.createElement("p");

            times.className = "travel-times";
            addBadge(times, "Sample car: 12 min", "travel-badge");
            addBadge(times, "Sample walk: 42 min", "travel-badge");
            addBadge(times, "Sample transit: 25 min", "travel-badge");
            map.className = "map-preview map-placeholder";
            map.textContent = "Map and directions placeholder";
            note.className = "travel-note";
            note.textContent = "These travel times are sample values only. Live maps and directions will be added in a later phase.";
            panel.append(times, map, note);
        }
    });

    section.append(button, panel);
    card.append(section);
}

function showService(service) {
    const card = document.createElement("article");
    const tags = document.createElement("div");
    const contact = document.createElement("div");
    const details = document.createElement("div");
    const moreButton = document.createElement("button");
    const heading = document.createElement("h3");

    card.className = "resource-card";
    tags.className = "badges";
    heading.textContent = service.name;
    addBadge(tags, category.value === "All" ? service.category : `Best fit: ${category.options[category.selectedIndex].text}`);
    addBadge(tags, "Contact organization about cost", "budget-badge");

    contact.className = "contact-details";
    addText(contact, `Languages: ${service.languages}`);
    addText(contact, `Address: ${service.address}`);
    addText(contact, `Phone: ${service.phone}`);

    details.className = "extra-details";
    details.hidden = true;
    addText(details, service.description);
    addText(details, `Eligibility: ${service.eligibility}`);
    addText(details, `Hours: ${service.hours}`);

    moreButton.className = "expand-button";
    moreButton.type = "button";
    moreButton.textContent = "Show more";
    moreButton.addEventListener("click", function () {
        details.hidden = !details.hidden;
        moreButton.textContent = details.hidden ? "Show more" : "Show less";
    });

    card.append(heading, tags, contact, details, moreButton);
    addTravelSection(card);
    resourceList.append(card);
}

function showStep(number) {
    steps.forEach(function (step, index) {
        step.hidden = index !== number;
    });

    steps[number].querySelector("select, input").focus();
}

get("continueButton").addEventListener("click", function () { showStep(1); });
get("categoryNextButton").addEventListener("click", function () { showStep(2); });
get("locationNextButton").addEventListener("click", function () { showStep(3); });
category.addEventListener("change", function () { renderCategoryGuide(categoryGuide); });

postalCode.addEventListener("input", function () {
    areaHint.textContent = postalInfo().message;
});

get("editButton").addEventListener("click", function () {
    results.hidden = true;
    questionFlow.hidden = false;
    showStep(0);
});

get("searchButton").addEventListener("click", async function () {
    const area = postalInfo().area;
    questionFlow.hidden = true;
    results.hidden = false;
    resourceList.innerHTML = "";
    summary.textContent = "Loading City of Toronto service data...";
    helpNote.innerHTML = "";

    let services;
    try {
        services = await getServices();
    } catch (error) {
        summary.textContent = "City of Toronto service data is unavailable right now.";
        resourceList.innerHTML = "<p>Please try again later.</p>";
        return;
    }

    const matches = services.filter(function (service) {
        return (area === "All" || service.area.includes(area)) &&
            matchesCategory(service) &&
            (language.value === "All" || service.languages.includes(language.value));
    });

    summary.textContent = `${matches.length} resource(s) found for ${ageGroup.value.toLowerCase()} users.`;
    renderCategoryGuide(helpNote);
    const dataReminder = document.createElement("p");
    dataReminder.className = "data-reminder";
    dataReminder.textContent = "Live service results are from City of Toronto Open Data. Confirm current eligibility, hours, and availability with each organization.";
    helpNote.append(dataReminder);

    if (!matches.length) {
        resourceList.innerHTML = "<p>No matching resources found. Try another category, language, or postal code.</p>";
        return;
    }

    matches.slice(0, 12).forEach(showService);
});

renderCategoryGuide(categoryGuide);
