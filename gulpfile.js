const { src, dest, series, watch } = require(`gulp`);
const del = require(`del`);
const sass = require('gulp-sass')(require('sass'));
const babel = require(`gulp-babel`);
const htmlCompressor = require(`gulp-htmlmin`);
const htmlValidator = require(`gulp-html`);
const jsLinter = require(`gulp-eslint`);
const jsCompressor = require(`gulp-uglify`);
const imageCompressor = require(`gulp-imagemin`);
const cache = require(`gulp-cache`);
const browserSync = require(`browser-sync`);
const sourcemaps = require('gulp-sourcemaps');
const reload = browserSync.reload;
const rigger = require('gulp-rigger');
const purgecss = require('gulp-purgecss');
const cleanCSS = require('gulp-clean-css');
const minify = require("gulp-minify");
let browserChoice = `default`;

async function safari () {
    browserChoice = `safari`;
}

async function firefox () {
    browserChoice = `firefox`;
}

async function chrome () {
    browserChoice = `google chrome`;
}

async function opera () {
    browserChoice = `opera`;
}

async function edge () {
    browserChoice = `microsoft-edge`;
}

async function allBrowsers () {
    browserChoice = [
        `safari`,
        `firefox`,
        `google chrome`,
        `opera`,
        `microsoft-edge`
    ];
}

let validateHTML = () => {
    return src([
        `dev/*.html`,
        `dev/**/*.html`]).pipe(rigger()).pipe(dest(`temp`)).pipe(dest(`prod`));
        /*.pipe(htmlValidator())*/;
};

let compressHTML = () => {
    return src([`prod/*.html`,`prod/**/*.html`])
                .pipe(dest(`prod`))
                .pipe(htmlCompressor({collapseWhitespace: true}))
};

let compileCSSForDev = () => {
    return src(`dev/styles/main.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: `expanded`,
            precision: 10
        }).on(`error`, sass.logError))
        .pipe(sourcemaps.write('./'))
        .pipe(dest(`temp/styles`));
};

let compileCSSForProd = () => {
    return src(`dev/styles/main.scss`)
        .pipe(sass({
            outputStyle: `expanded`,
            precision: 10
        }).on(`error`, sass.logError))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(dest(`prod/styles`));
};

let transpileJSForDev = () => {
    return src(`dev/scripts/*.js`)
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('./'))
        .pipe(dest(`temp/scripts`));
};


let transpileJSForProd = () => {
    return src(`dev/**/*.js`)
        .pipe(babel())
        .pipe(dest(`prod/scripts`))
        .pipe(minify({noSource: true}))
        .pipe(dest('prod/scripts/app.js'));

};
let purgecssTask = () => {
    return src('dev/libs/**/*.css')
        .pipe(purgecss({content: ['dev/**/*.html']}))
        .pipe(dest('prod/libs/'))
};
let lintJS = () => {
    return src(`dev/scripts/*.js`)
        .pipe(jsLinter({
            parserOptions: {
                ecmaVersion: 2017,
                sourceType: `module`
            },
            rules: {
                indent: [2, 4, {SwitchCase: 1}],
                quotes: [2, `backtick`],
                semi: [2, `always`],
                'linebreak-style': [2, `unix`],
                'max-len': [1, 85, 4]
            },
            env: {
                es6: true,
                node: true,
                browser: true
            },
            extends: `eslint:recommended`
        }))
        .pipe(jsLinter.formatEach(`compact`, process.stderr));
};

let copyUnprocessedAssetsForProd = () => {
    return src([
        `dev/*.*`,
        `temp/*.html`,        // Source all files,
        `dev/**`,  
        `!dev/*.html`,      // and all folders,
        `!dev/html/`,    // but not the HTML folder
        `!dev/html/*.*`, // or any files in it
        `!dev/html/**`,  // or any sub folders;
        `!dev/img/`,     // ignore images;
        `!dev/styles/**` // and, ignore Sass/CSS.
        //`!dev/tamplate/` // tamplate
    ], {dot: true}).pipe(dest(`prod`));
};

let compressImages = () => {
    return src(`dev/img/**/*`)
        .pipe(cache(
            imageCompressor({
                optimizationLevel: 3, // For PNG files. Accepts 0 – 7; 3 is default.
                progressive: true,    // For JPG files.
                multipass: false,     // For SVG files. Set to true for compression.
                interlaced: false     // For GIF files. Set to true for compression.
            })
        ))
        .pipe(dest(`prod/img`));
};

let serve = () => {
    browserSync({
        notify: true,
        port: 9000,
        reloadDelay: 50,
        browser: browserChoice,
        server: {
            baseDir: [
                `temp`,
                `dev`,
                `dev/html`,
            ]
        }
    });
    
    watch(`dev/scripts/*.js`,
        series(lintJS, transpileJSForDev)
    ).on(`change`, reload);

    watch(`dev/styles/**/*.scss`,
        series(compileCSSForDev)
    ).on(`change`, reload);

    watch(`dev/**/*.html`,
        series(validateHTML)
    ).on(`change`, reload);

    watch(`dev/img/**/*`).on(`change`, reload);
};

async function clean() {
    let fs = require(`fs`),
        i,
        foldersToDelete = [`./temp`, `prod`];

    for (i = 0; i < foldersToDelete.length; i++) {
        try {
            fs.accessSync(foldersToDelete[i], fs.F_OK);
            process.stdout.write(`\n\tThe ` + foldersToDelete[i] +
                ` directory was found and will be deleted.\n`);
            del(foldersToDelete[i]);
        } catch (e) {
            process.stdout.write(`\n\tThe ` + foldersToDelete[i] +
                ` directory does NOT exist or is NOT accessible.\n`);
        }
    }

    process.stdout.write(`\n`);
}

async function listTasks () {
    let exec = require(`child_process`).exec;

    exec(`gulp --tasks`, function (error, stdout, stderr) {
        if (null !== error) {
            process.stdout.write(`An error was likely generated when invoking ` +
                `the “exec” program in the default task.`);
        }

        if (`` !== stderr) {
            process.stdout.write(`Content has been written to the stderr stream ` +
                `when invoking the “exec” program in the default task.`);
        }

        process.stdout.write(`\n\tThis default task does ` +
            `nothing but generate this message. The ` +
            `available tasks are:\n\n${stdout}`);
    });
}

exports.safari = series(safari, serve);
exports.firefox = series(firefox, serve);
exports.chrome = series(chrome, serve);
exports.opera = series(opera, serve);
exports.edge = series(edge, serve);
exports.safari = series(safari, serve);
exports.allBrowsers = series(allBrowsers, serve);
exports.validateHTML = validateHTML;
exports.compressHTML = compressHTML;
exports.compileCSSForDev = compileCSSForDev;
exports.compileCSSForProd = compileCSSForProd;
exports.transpileJSForDev = transpileJSForDev;
exports.transpileJSForProd = transpileJSForProd;
exports.lintJS = lintJS;
exports.purgecssTask = purgecssTask;
exports.copyUnprocessedAssetsForProd = copyUnprocessedAssetsForProd;
exports.build = series(
    validateHTML,
    compressHTML,
    compileCSSForProd,
    lintJS,
    compressImages,
    copyUnprocessedAssetsForProd
    //purgecssTask
);
exports.compressImages = compressImages;
exports.serve = series(
    compileCSSForDev, 
    lintJS, 
    transpileJSForDev, 
    validateHTML, 
    serve);
exports.clean = clean;
exports.default = listTasks;



