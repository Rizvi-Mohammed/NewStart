# NewStart – Community Resources Website

## 1. Project Description

NewStart is a web application designed to help newcomers and community members find community resources and support services in Toronto.

The application provides information about organizations offering employment assistance, settlement services, language programs, housing support, healthcare, and other community services.

The website is developed using Node.js, Express.js, and EJS. It uses a JSON dataset to store community resource information and allows users to search, filter, browse, and view individual resource details.

### Main Features

- Browse all available community resources.
- Search for resources using keywords.
- Filter resources by category.
- Filter resources by language.
- Filter resources by municipality or neighbourhood.
- Sort resources alphabetically by name.
- View detailed information about individual organizations.
- Access resource information through REST API endpoints.
- Display dynamic webpages using EJS templates.

## 2. Team Members

| No. | Team Member     | Student ID   |
| --- | --------------- | ------------ |
| 1   | Lawrence George-Tagoe | 160010187 |
| 2   | Mohammed Abbas Rizvi | 141001255 |


## 3. Technologies Used

| Technology | Purpose                           |
| ---------- | --------------------------------- |
| Node.js    | JavaScript runtime environment    |
| Express.js | Server-side framework and routing |
| EJS        | Dynamic webpage rendering         |
| JavaScript | Application functionality         |
| HTML5      | Website structure                 |
| CSS3       | Website styling                   |
| JSON       | Community resource data storage   |
| Git        | Version control                   |
| GitHub     | Source code repository            |

## 4. Dataset Source

The application uses a JSON dataset stored locally in the project.

**Dataset file:** `data/resources.json`

**Dataset format:** JSON (JavaScript Object Notation)

**Dataset content:** Community organizations and services available to residents and newcomers.

The dataset contains information such as:

- Organization name
- Service category
- Service description
- Eligibility requirements
- Languages offered
- Search tags
- Location and address
- Contact information
- Operating hours
- Accessibility information
- Source update date

The data comes from the City of Toronto Open Data newcomer services dataset:

`https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search?resource_id=7298a558-16f6-4477-ada8-29a1c848aebe&limit=1000`

`scripts/prepare-data.js` downloaded and cleaned this data once and saved it as `data/resources.json`. The running Express app only reads the local JSON file; it does not call the external API.

## 5. Installation and Setup

### Prerequisites

Before running the application, install:

- Node.js
- npm (Node Package Manager)
- Visual Studio Code (recommended)
- Git (recommended)

### Step 1: Clone the GitHub repository

```
git clone YOUR_GITHUB_REPOSITORY_URL
```

### Step 2: Navigate to the project folder

```
cd NewStart
```

Use the actual name of your project folder if it is different.

### Step 3: Install project dependencies

```
npm install
```

This command installs the dependencies specified in `package.json`, including Express and EJS.

### Step 4: Start the application

```
npm start
```

The application starts on port 3000 by default.

The terminal should display:

```
NewStart is running at http://localhost:3000
```

### Step 5: Open the website

Open your browser and navigate to:

[http://localhost:3000](http://localhost:3000)

## 6. Application Routes

The application contains two main categories of routes:

1. API routes – return information in JSON format.
2. EJS routes – render dynamic HTML webpages.

### 6.1 API Routes

API routes allow users or external applications to retrieve community resource information.

| HTTP Method | Endpoint             | Description                                    |
| ----------- | -------------------- | ---------------------------------------------- |
| GET         | `/api/resources`     | Retrieves all resources or filtered resources. |
| GET         | `/api/resources/:id` | Retrieves a specific resource using its ID.    |
| GET         | `/api/search`        | Searches resources using a required keyword.   |

#### API Route Details

**1. GET /api/resources**

Retrieves all community resources.

Optional query parameters:

| Parameter | Description                              | Example                |
| --------- | ---------------------------------------- | ---------------------- |
| keyword   | Searches resource information            | `?keyword=employment`  |
| category  | Filters by category                      | `?category=Employment` |
| language  | Filters by language                      | `?language=English`    |
| area      | Filters by municipality or neighbourhood | `?area=North York`     |
| sort      | Sorts resources alphabetically           | `?sort=name`           |

Example:

```
http://localhost:3000/api/resources?category=Employment
```

Example response:

```
{
  "count": 1,
  "resources": [
    {
      "id": "resource-1",
      "name": "Toronto District School Board",
      "category": "Employment"
    }
  ]
}
```

**2. GET /api/resources/:id**

Retrieves one resource using its unique resource ID.

Example:

```
http://localhost:3000/api/resources/resource-1
```

If the resource does not exist, the application returns HTTP status `404`.

```
{
  "error": "Resource not found."
}
```

**3. GET /api/search**

Searches community resources using a keyword query parameter.

The keyword parameter is required.

Example:

```
http://localhost:3000/api/search?keyword=employment
```

If the keyword is missing, the application returns HTTP status `400`.

```
{
  "error": "A keyword query parameter is required."
}
```

A successful response contains the search keyword, number of matching resources, and matching resource records.

### 6.2 EJS Routes

EJS routes render dynamic HTML pages using the templates stored in the `views` directory.

| HTTP Method | Endpoint          | EJS Template          | Description                                               |
| ----------- | ----------------- | --------------------- | --------------------------------------------------------- |
| GET         | `/`               | `home.ejs`            | Displays the homepage and total resource count.           |
| GET         | `/resources`      | `resources.ejs`       | Displays all resources and available filters.             |
| GET         | `/resources/:id`  | `resource-detail.ejs` | Displays detailed information about a selected resource.  |
| GET         | `/search`         | `search.ejs`          | Displays the search page.                                 |
| POST        | `/search`         | `search.ejs`          | Processes keyword searches or the 4-step finder (language, category, postal code, age group) and displays matching results. |
| GET         | Any unmatched URL | `404.ejs`             | Displays the not-found webpage.                           |

#### EJS Route Details

**1. GET /**

Displays the homepage and passes the total number of resources to the EJS template.

**2. GET /resources**

Displays the resource listing page.

Supports the following query parameters:

- `keyword`
- `category`
- `language`
- `area`
- `sort`

Example:

```
http://localhost:3000/resources?category=Employment
```

**3. GET /resources/:id**

Displays detailed information about a selected community resource.

Example:

```
http://localhost:3000/resources/resource-1
```

If the resource is not found, the application displays the 404 page.

**4. GET /search**

Displays the search page with the available category, language, and area options.

**5. POST /search**

Processes the search form submitted by the user.

The application:

- Checks whether a keyword was entered.
- Returns an error if the keyword is empty.
- Searches the resource dataset.
- Displays matching results using the EJS search template.

**6. GET Any Unmatched URL**

Displays a custom 404 error page when a requested webpage does not exist.

For unmatched API routes, the application returns a JSON error response instead.

## 7. JSON Record Structure

The application stores community resource information in `data/resources.json`.

Each resource is represented as a JSON object.

### Example JSON Record

```
{
  "id": "resource-1",
  "sourceId": 1,
  "name": "Toronto District School Board",
  "category": "Employment",
  "description": "Community Connections Mentorship Program (formerly HOST Program) -- supervised group activities for newcomer children, youth and young adults to help orient them to their new community and establish social and professional networks * assistance from peer and professional mentors, with focus on citizenship and civic engagement or skills and career development",
  "eligibility": "TDSB newcomer students 6-24 years",
  "languages": [
    "English"
  ],
  "tags": [
    "employment",
    "newcomer-support"
  ],
  "location": {
    "address": "3701-3741 Chesswood Dr",
    "municipality": "North York",
    "neighbourhood": "York University Heights, 27",
    "postalCode": "M3J 2P6",
    "latitude": null,
    "longitude": null
  },
  "contact": {
    "phone": "416-395-2027",
    "email": "WCNyouth@tdsb.on.ca",
    "website": "http://communitysvcs.tdsb.on.ca"
  },
  "hours": "Mon-Fri 10 am-6 pm",
  "accessibility": "Wheelchair accessible automatic main entrance ; Barrier-free washroom including door and stall ; Designated parking",
  "sourceUpdated": "2015-02-10T05:00:00"
}
```

### 7.1 Main JSON Fields

| Field         | Data Type         | Description                                         |
| ------------- | ----------------- | --------------------------------------------------- |
| id            | String            | Unique resource identifier.                         |
| sourceId      | Number            | Original dataset record ID.                         |
| name          | String            | Name of the organization.                           |
| category      | String            | Category of the community service.                  |
| description   | String            | Detailed description of the service.                |
| eligibility   | String            | Eligibility requirements for accessing the service. |
| languages     | Array             | Languages supported by the organization.            |
| tags          | Array             | Keywords used to categorize and search resources.   |
| location      | Object            | Contains geographical and address information.      |
| contact       | Object            | Contains organization contact information.          |
| hours         | String            | Organization operating hours.                       |
| accessibility | String            | Accessibility facilities and services.              |
| sourceUpdated | String (DateTime) | Date the original source record was updated.        |

### 7.2 Location Object

The `location` object stores the physical address and geographical details.

| Field         | Data Type      | Description                                     |
| ------------- | -------------- | ----------------------------------------------- |
| address       | String         | Street address of the organization.             |
| municipality  | String         | Municipality where the organization is located. |
| neighbourhood | String         | Neighbourhood or district.                      |
| postalCode    | String         | Canadian postal code.                           |
| latitude      | Number or Null | Geographical latitude.                          |
| longitude     | Number or Null | Geographical longitude.                         |

### 7.3 Contact Object

The `contact` object stores the organization's contact details.

| Field   | Data Type | Description                    |
| ------- | --------- | ------------------------------ |
| phone   | String    | Organization telephone number. |
| email   | String    | Organization email address.    |
| website | String    | Organization website URL.      |

### 7.4 Arrays

Two fields use arrays to store multiple values:

**languages**

Contains the languages supported by the organization.

Example:

```
"languages": [
  "English",
  "French"
]
```

**tags**

Contains keywords associated with the resource.

Example:

```
"tags": [
  "employment",
  "newcomer-support"
]
```

### 7.5 Null Values

The latitude and longitude fields may contain `null` when geographical coordinates are unavailable.

Example:

```
"latitude": null,
"longitude": null
```

This means that coordinates have not been provided for that resource.

## 8. Search and Filtering Functionality

The application uses the `filterResources()` function to filter community resources.

Users can search and filter resources using:

- **Keyword:** Searches the organization name, category, description, eligibility, municipality, neighbourhood, and languages.
- **Category:** Finds resources belonging to a selected category.
- **Language:** Finds organizations offering a selected language.
- **Area:** Filters resources by municipality or neighbourhood.
- **Sorting:** Arranges results alphabetically by organization name when `sort=name` is selected.

The `searchOptions()` function dynamically generates the available categories, languages, and municipalities from the JSON dataset.

## 9. Error Handling

The application includes error handling for different situations.

| Situation                      | HTTP Status               | Response                             |
| ------------------------------ | ------------------------- | ------------------------------------ |
| Resource not found through API | 404                       | JSON error message                   |
| Missing keyword in API search  | 400                       | JSON error message                   |
| Invalid API endpoint           | 404                       | API route not found                  |
| Invalid webpage URL            | 404                       | Custom 404 EJS page                  |
| Dataset loading failure        | Application startup error | Error message describing the problem |

## 10. Project Folder Structure

The project structure is:

```
NewStart/
│
├── server.js
├── package.json
├── package-lock.json
├── ReadMe.md
├── index.html            (original Part 1 static prototype)
│
├── data/
│   ├── resources.json
│   └── guides.json
│
├── scripts/
│   ├── prepare-data.js
│   └── validate-data.js
│
├── views/
│   ├── home.ejs
│   ├── resources.ejs
│   ├── resource-detail.ejs
│   ├── search.ejs
│   ├── 404.ejs
│   └── partials/
│       └── guide.ejs
│
├── public/
│   └── css/
│       └── style.css
│
└── js/
    └── script.js         (original Part 1 prototype script)
```

Static files are served from `public/`, which works both locally and on Vercel.

## 11. Dependencies

The application requires the following Node.js packages:

- Express – Web application framework.
- EJS – Embedded JavaScript templating engine.

Install dependencies using:

```
npm install express ejs
```

The project should also have a start script in `package.json`:

```
{
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "ejs": "^3.1.10"
  }
}
```

Use the actual dependency versions in your existing `package.json` if they differ.

## 12. Deployment (Vercel)

The app is deployed with Vercel's GitHub integration:

- Every push or merge to `main` deploys to production automatically.
- Every other branch and pull request gets its own preview URL.

Vercel runs `server.js` as a single function and serves files in `public/` from its CDN. `vercel.json` sets the framework to Express so Vercel builds the server instead of treating the project as a static HTML site.

## 13. Conclusion

NewStart provides a centralized platform for discovering community resources and support services.

By combining Node.js, Express.js, EJS, and JSON, the application provides both a user-friendly website and REST API endpoints for accessing community resource information.

The application supports searching, filtering, and viewing community organizations to help users identify services that meet their needs.
