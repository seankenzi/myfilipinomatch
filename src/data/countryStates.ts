/**
 * State/Province mappings for major countries where foreign users typically come from.
 * For countries not listed here, users type their state/province manually.
 */
export const COUNTRY_STATES: Record<string, string[]> = {
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming", "District of Columbia",
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland",
  ],
  "Canada": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
    "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
    "Quebec", "Saskatchewan", "Yukon",
  ],
  "Australia": [
    "Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland",
    "South Australia", "Tasmania", "Victoria", "Western Australia",
  ],
  "Germany": [
    "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse",
    "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate",
    "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia",
  ],
  "France": [
    "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire",
    "Corsica", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandy",
    "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur",
  ],
  "Italy": [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
    "Friuli Venezia Giulia", "Lazio", "Liguria", "Lombardy", "Marche", "Molise",
    "Piedmont", "Puglia", "Sardinia", "Sicily", "Trentino-Alto Adige", "Tuscany",
    "Umbria", "Valle d'Aosta", "Veneto",
  ],
  "Spain": [
    "Andalusia", "Aragon", "Asturias", "Balearic Islands", "Basque Country",
    "Canary Islands", "Cantabria", "Castile and León", "Castile-La Mancha", "Catalonia",
    "Ceuta", "Extremadura", "Galicia", "La Rioja", "Madrid", "Melilla", "Murcia",
    "Navarre", "Valencian Community",
  ],
  "Netherlands": [
    "Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg",
    "North Brabant", "North Holland", "Overijssel", "South Holland", "Utrecht", "Zeeland",
  ],
  "Japan": [
    "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima",
    "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa",
    "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu",
    "Shizuoka", "Aichi", "Mie", "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara",
    "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi",
    "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka", "Saga", "Nagasaki",
    "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa",
  ],
  "South Korea": [
    "Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Sejong",
    "Gyeonggi", "Gangwon", "North Chungcheong", "South Chungcheong",
    "North Jeolla", "South Jeolla", "North Gyeongsang", "South Gyeongsang", "Jeju",
  ],
  "Sweden": [
    "Blekinge", "Dalarna", "Gävleborg", "Gotland", "Halland", "Jämtland", "Jönköping",
    "Kalmar", "Kronoberg", "Norrbotten", "Örebro", "Östergötland", "Skåne", "Södermanland",
    "Stockholm", "Uppsala", "Värmland", "Västerbotten", "Västernorrland", "Västmanland",
    "Västra Götaland",
  ],
  "Norway": [
    "Agder", "Innlandet", "Møre og Romsdal", "Nordland", "Oslo", "Rogaland",
    "Troms og Finnmark", "Trøndelag", "Vestfold og Telemark", "Vestland", "Viken",
  ],
  "Denmark": [
    "Capital Region", "Central Denmark", "North Denmark", "Region Zealand", "South Denmark",
  ],
  "Singapore": [],
  "Switzerland": [
    "Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft",
    "Basel-Stadt", "Bern", "Fribourg", "Geneva", "Glarus", "Graubünden", "Jura",
    "Lucerne", "Neuchâtel", "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz",
    "Solothurn", "St. Gallen", "Thurgau", "Ticino", "Uri", "Valais", "Vaud", "Zug", "Zürich",
  ],
  "New Zealand": [
    "Auckland", "Bay of Plenty", "Canterbury", "Gisborne", "Hawke's Bay", "Manawatū-Whanganui",
    "Marlborough", "Nelson", "Northland", "Otago", "Southland", "Taranaki", "Tasman",
    "Waikato", "Wellington", "West Coast",
  ],
};

/** Check if a country has a predefined state/province list */
export const hasStateDropdown = (country: string): boolean =>
  country in COUNTRY_STATES && COUNTRY_STATES[country].length > 0;

/** Get states/provinces for a country (empty array if not mapped) */
export const getStatesByCountry = (country: string): string[] =>
  COUNTRY_STATES[country] || [];

/** Get the label for the subdivision field based on country */
export const getSubdivisionLabel = (country: string): string => {
  if (["United States"].includes(country)) return "State";
  if (["United Kingdom"].includes(country)) return "Country/Region";
  if (["Canada", "Australia"].includes(country)) return "Province/Territory";
  if (["Japan"].includes(country)) return "Prefecture";
  if (["South Korea"].includes(country)) return "Province/City";
  if (["Switzerland"].includes(country)) return "Canton";
  return "State/Province";
};
