
// CURRENTLY UNUSED
const esbuild = require("esbuild")
const liveServer = require("compodoc/live-server")

// Turn on LiveServer on http://localhost:7000
liveServer.start({
    port: 7000,
    host: 'localhost',
    root: '',
    open: true,
    ignore: 'node_modules',
    wait: 0,
});

// Generate CSS/JS Builds
esbuild
    .build({
        logLevel: 'debug',
        metafile: true,
        entryPoints: ["frontend/App.jsx", "frontend/style.css"],
        outdir: "public/assets",
        bundle: true,
        watch: true,
        plugins: [],
    })
    .then(() => console.log('⚡ Styles & Scripts Compiled! ⚡ '))
    .catch(() => process.exit(1));