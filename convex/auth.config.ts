const siteUrl = process.env.CONVEX_SITE_URL;

if (!siteUrl) {
    throw new Error("Missing built-in CONVEX_SITE_URL for Convex auth.");
}

const authConfig = {
    providers: [
        {
            domain: siteUrl,
            applicationID: "convex",
        },
    ],
};

export default authConfig;