import { logger } from "../../utils/logger.js";

export const DEPARTMENTS = [
  { code: "PWD",  name: "Public Works Department",  description: "Roads, bridges, public buildings" },
  { code: "WRD",  name: "Water Resources Department", description: "Irrigation, dams, canals" },
  { code: "TRN",  name: "Transport Department",     description: "State transport and highways" },
  { code: "MUN",  name: "Municipal Administration", description: "Urban local bodies" },
  { code: "HLT",  name: "Health Infrastructure",    description: "Hospitals, clinics, medical supplies" },
  { code: "EDU",  name: "Education Department",     description: "Schools, colleges, labs" },
];

export const LOCATIONS = [
  { name: "Hyderabad",   state: "Telangana",   latitude: 17.385044, longitude: 78.486671 },
  { name: "Warangal",    state: "Telangana",   latitude: 17.968900, longitude: 79.594100 },
  { name: "Karimnagar",  state: "Telangana",   latitude: 18.439200, longitude: 79.128800 },
  { name: "Nizamabad",   state: "Telangana",   latitude: 18.672500, longitude: 78.094100 },
  { name: "Khammam",     state: "Telangana",   latitude: 17.247300, longitude: 80.151400 },
  { name: "Vijayawada",  state: "Andhra Pradesh", latitude: 16.506200, longitude: 80.648000 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", latitude: 17.686800, longitude: 83.218500 },
  { name: "Tirupati",    state: "Andhra Pradesh", latitude: 13.628800, longitude: 79.419200 },
  { name: "Bengaluru",   state: "Karnataka",   latitude: 12.971600, longitude: 77.594600 },
  { name: "Mysuru",      state: "Karnataka",   latitude: 12.295800, longitude: 76.639400 },
  { name: "Chennai",     state: "Tamil Nadu",  latitude: 13.082700, longitude: 80.270700 },
  { name: "Coimbatore",  state: "Tamil Nadu",  latitude: 11.016800, longitude: 76.955800 },
  { name: "Mumbai",      state: "Maharashtra", latitude: 19.076000, longitude: 72.877700 },
  { name: "Pune",        state: "Maharashtra", latitude: 18.520400, longitude: 73.856700 },
  { name: "Nagpur",      state: "Maharashtra", latitude: 21.145800, longitude: 79.088200 },
  { name: "Ahmedabad",   state: "Gujarat",     latitude: 23.022500, longitude: 72.571400 },
  { name: "Surat",       state: "Gujarat",     latitude: 21.170200, longitude: 72.831100 },
  { name: "Jaipur",      state: "Rajasthan",   latitude: 26.912400, longitude: 75.787300 },
  { name: "Lucknow",     state: "Uttar Pradesh", latitude: 26.846700, longitude: 80.946200 },
  { name: "Bhopal",      state: "Madhya Pradesh", latitude: 23.259900, longitude: 77.412600 },
];

export const COMPANIES = [
  { name: "Alpha Infra Constructions Pvt Ltd", registration_id: "IN-ALP-2008-0412", industry: "Construction", location: "Hyderabad" },
  { name: "Beta Engineering Works",            registration_id: "IN-BET-2010-0755", industry: "Engineering",  location: "Warangal" },
  { name: "Gamma Buildtech Ltd",               registration_id: "IN-GAM-2005-0231", industry: "Construction", location: "Vijayawada" },
  { name: "Delta Urban Developers Pvt Ltd",    registration_id: "IN-DEL-2012-0910", industry: "Real Estate",  location: "Bengaluru" },
  { name: "Epsilon Water Solutions",           registration_id: "IN-EPS-2014-0220", industry: "Water",        location: "Chennai" },
  { name: "Zeta Health Systems Pvt Ltd",       registration_id: "IN-ZET-2011-0888", industry: "Healthcare",   location: "Mumbai" },
  { name: "Eta Education Infrastructure",      registration_id: "IN-ETA-2016-0100", industry: "Construction", location: "Pune" },
  { name: "Theta Transport Corp",              registration_id: "IN-THE-2009-0444", industry: "Transport",    location: "Nagpur" },
  { name: "Iota Roadways Ltd",                 registration_id: "IN-IOT-2007-0318", industry: "Roads",        location: "Lucknow" },
  { name: "Kappa Electricals Pvt Ltd",         registration_id: "IN-KAP-2013-0555", industry: "Electrical",   location: "Ahmedabad" },
  { name: "Lambda Civil Works",                registration_id: "IN-LAM-2010-0677", industry: "Construction", location: "Jaipur" },
  { name: "Mu Constructions",                  registration_id: "IN-MU-2015-0788", industry: "Construction", location: "Bhopal" },
  { name: "Nu Engineering Services",           registration_id: "IN-NU-2012-0999", industry: "Engineering",  location: "Coimbatore" },
  { name: "Xi Infratech Ltd",                  registration_id: "IN-XI-2006-0121", industry: "Infrastructure", location: "Hyderabad" },
  { name: "Omicron Projects Pvt Ltd",          registration_id: "IN-OMI-2018-0345", industry: "Construction", location: "Mysuru" },
  { name: "Pi Sustainable Solutions",          registration_id: "IN-PI-2019-0456", industry: "Environment",  location: "Bengaluru" },
  { name: "Rho Constructions Pvt Ltd",         registration_id: "IN-RHO-2004-0001", industry: "Construction", location: "Mumbai" },
  { name: "Sigma Builders",                    registration_id: "IN-SIG-2011-0223", industry: "Construction", location: "Surat" },
  { name: "Tau Equipment Suppliers",           registration_id: "IN-TAU-2017-0891", industry: "Supplies",     location: "Tirupati" },
  { name: "Upsilon Roads Pvt Ltd",             registration_id: "IN-UPS-2008-0644", industry: "Roads",        location: "Visakhapatnam" },
];

export const PROJECT_THEMES = [
  { suffix: "Highway Widening",                project: "NH-44 Widening" },
  { suffix: "Bridge Construction",             project: "Godavari Bridge" },
  { suffix: "Water Pipeline Installation",     project: "Urban Water Grid" },
  { suffix: "School Building Construction",    project: "Govt Schools Upgrade" },
  { suffix: "Hospital Block Construction",     project: "District Hospital Expansion" },
  { suffix: "Smart City Infrastructure",       project: "Smart City Phase 1" },
  { suffix: "Solar Power Plant Installation",  project: "Solar Rooftop Program" },
  { suffix: "Sewage Treatment Plant",          project: "City STP Upgrade" },
  { suffix: "Bus Terminal Modernization",      project: "BSRTC Terminals" },
  { suffix: "Metro Feeder Road Work",          project: "Metro Feeder Roads" },
];

export const seedProcurementBase = async (client) => {
  // Departments
  for (const d of DEPARTMENTS) {
    await client.query(
      `INSERT INTO departments (code, name, description)
       VALUES ($1,$2,$3)
       ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code, description = EXCLUDED.description`,
      [d.code, d.name, d.description]
    );
  }

  // Locations
  for (const l of LOCATIONS) {
    await client.query(
      `INSERT INTO locations (name, state, country, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (name, state) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
      [l.name, l.state, "India", l.latitude, l.longitude]
    );
  }

  // Companies
  for (const c of COMPANIES) {
    const { rows } = await client.query(
      "SELECT id FROM locations WHERE name = $1 LIMIT 1",
      [c.location]
    );
    const locationId = rows[0]?.id || null;

    await client.query(
      `INSERT INTO companies (name, registration_id, industry, location_id, is_active)
       VALUES ($1,$2,$3,$4,TRUE)
       ON CONFLICT ((LOWER(name)))
       DO UPDATE SET registration_id = EXCLUDED.registration_id,
                     industry        = EXCLUDED.industry,
                     location_id     = EXCLUDED.location_id`,
      [c.name, c.registration_id, c.industry, locationId]
    );
  }

  // Projects
  for (const t of PROJECT_THEMES) {
    const code = `PRJ-${t.project.replace(/[^A-Z0-9]/gi, "").slice(0, 8).toUpperCase()}`;
    await client.query(
      `INSERT INTO projects (code, name, description)
       VALUES ($1,$2,$3)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
      [code, t.project, `${t.project} — ${t.suffix}`]
    );
  }

  logger.info("Seeded departments, locations, companies, projects");
};
