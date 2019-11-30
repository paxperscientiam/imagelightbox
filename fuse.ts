// tslint:disable:no-console
// tslint:disable:semicolon

const args = require('minimist')(process.argv.slice(2))

const MODE = args.mode || 'development'

import * as fs from 'fs'

const dlv = require('@paxperscientiam/dlv.ts')

function importJSON(filePath: string, property?: string) {
    if (fs.existsSync(filePath)) {
        let json = fs.readFileSync(filePath, 'utf8')
        // @ts-ignore
        json = JSON.parse(json)
        // @ts-ignore
        if (property != null) {
            // @ts-ignore
            return dlv(json, property)
        }
        return json
    }
    // @ts-ignore
    return JSON.parse('{}')
}

const TypeDoc = require('typedoc')

const app = new TypeDoc.Application({
    experimentalDecorators: true,
    logger: 'console',
    mode:   'file',
    module: 'CommonJS',
    target: 'ES5',
})

const project = app.convert(app.expandInputFiles(['src', 'src/@types']))

const PKG = importJSON('./package.json')

const bannerStatement =  (isProduction: boolean) => {
    return `production: ${isProduction}`
}

const Autoprefixer = require('autoprefixer')
const Cssnano = require('cssnano')
const Unprefix = require('postcss-unprefix')
const Banner = require('postcss-banner')

const typeChecker = require('fuse-box-typechecker').TypeChecker({
    tsConfig: './tsconfig.json',
    basePath: './',
    name: 'checkerSync'
});

import {
    BannerPlugin,
    CSSPlugin,
    CSSResourcePlugin,
    EnvPlugin,
    FuseBox,
    PostCSSPlugin,
    QuantumPlugin,
    SassPlugin,
    TerserPlugin,
    WebIndexPlugin,
} from 'fuse-box'

import {
    context as ctx,
    exec,
    src,
    task,
} from 'fuse-box/sparky'

function aggregatePostCSSPlugins(plugins: any[]) {
    return plugins.filter((plugin) => plugin !== false)
}

class CTX {
    isProduction: boolean = false
    isTest: boolean = false

    getConfig() {
        return FuseBox.init({
            //             shim: {
            //                 jquery: {
            //                     exports: '$',
            //                     source: 'node_modules/jquery/dist/jquery.js',
            //                 },
            //             },

            homeDir:  dlv(PKG, 'homeDir') || 'src',
            output: 'dist/$name.js',

            target: 'browser@es5',

            cache: true,
            plugins: [
                EnvPlugin({
                    COMPILE_TIME: `${Date.now().toString()}`,
                    PROJECT_NAME: 'bookblock',
                }),
                WebIndexPlugin({
                    cssPath: 'css',
                    path: '.',
                    template: 'src/index.html',
                }),
                [
                    SassPlugin({
                        importer: true,
                        //                        resources: [{ test: /.*/, file: 'resources.scss' }],
                    }),
                    // PostCSSPlugin(aggregatePostCSSPlugins(
                    //     [
                    //         Unprefix(),
                    //         Autoprefixer(),
                    //         Cssnano(),
                    //         // this.isProduction && Banner({
                    //         //     banner: bannerStatement(this.isProduction),
                    //         //     important: true,
                    //         // }),
                    //         Banner({
                    //             banner: bannerStatement(this.isProduction),
                    //             important: true,
                    //         }),

                    //     ])),
                    CSSResourcePlugin({
                        dist: 'dist/css-resources',
                        inline: true,
                    }),
                    CSSPlugin({inject: true}),
                ],
                TerserPlugin({
                    compress: {
                        drop_console: true,
                    },
                    output: {
                        comments: 'some',
                        preamble: `/*!
${bannerStatement(this.isProduction)}
*/`,
                    },
                }),
                QuantumPlugin({
                    replaceProcessEnv: true,

                    ensureES5: true,
                    target: 'browser',

                    css: {
                        clean: true,
                        path: 'css/styles.min.css',
                    },
                    cssFiles: {
                        'default/src**': 'css/app.min.css',
                    },

                    // bakeApiIntoBundle: 'imagelightbox',
                    // containedAPI: true,
                    treeshake: true,
                    // settings come from Terser Plugin
                    uglify: true,
                }),
                //                 BannerPlugin(`/*! ${bannerStatement(this.isProduction)} */`),
            ],
        })
    }

    createBundle(fuse: FuseBox, instructions: string, name: string) {
        const bundle = fuse.bundle(name)
        if (!this.isProduction) {
            bundle.watch()
            bundle.hmr()
        }
        bundle.instructions(instructions)

        return bundle
    }
}

ctx(CTX)

task('test', (context: CTX) => {
    context.isProduction = true
    const fuse = context.getConfig()
    console.dir(fuse.collectionSource.context.quantumSplitConfig)

    //     fuse.dev()
    //     console.log(fuse)
    //     setInterval(() => {
    //         console.log('OMFG')
    //         fuse.sendPageReload()
    //     }, 1000)
})

task('copy:js', async () => {
    await src('./**/*.js', { base: './src/js' })
        .dest('./dist/js')
        .exec()
})

task('copy:images', async () => {
    await src('./**/*.png', { base: './src/assets' })
        .dest('./dist/')
        .exec()
})

task('copy', [
    '&copy:js', // parallel task mode
    '&copy:images', // parallel task mode
])

task('clean', async () => {
    await src('./dist')
        .clean('dist/')
        .exec()
})

task('watch', async (context: CTX) => {
    const fuse = context.getConfig()
    fs.watch('./src/index.html', {
        recursive: true,
    }, async (eventType, filename) => {
        console.log(`event type is: ${eventType}`)
        if (filename) {
            console.log(`filename provided: ${filename}`)
            fuse.sendPageReload()
        } else {
            console.log('filename not provided')
        }
    })
})

task('build', ['test:ts'], async (context: CTX) => {
    context.isProduction = true
    console.log('PRODUCTION BUILD')
    //    const fuse = context.getConfig()
    await exec('default')
})

task('default', ['clean'], async (context: CTX) => {
    const fuse = context.getConfig()
    if (!context.isProduction) {
        fuse.dev()
        fs.watch('./src/index.html', {
            recursive: true,
        }, (eventType, filename) => {
            console.log(`event type is: ${eventType}`)
            if (filename) {
                console.log(`filename provided: ${filename}`)
                fuse.sendPageReload()
            } else {
                console.log('filename not provided')
            }
        })
    }

    //    context.createBundle(fuse, '~ index.ts', 'vendor')

    context.createBundle(fuse, '> index.ts', 'imagelightbox')

    await fuse.run()
})

task('test:ts', [], async (context: CTX) => {
    console.log(process.env.NODE_ENV)
    if (MODE === 'production' || context.isProduction) {
        console.log('PRODUCTION TEST')
        const errors = typeChecker.runSync()
        if (errors > 0) {
            console.log('Too many errors to publish!!')
            process.exit()
        }
    } else {
        console.log('dev testing')
        await typeChecker.worker_watch('./src', (errors: number) => {
            console.log(errors)
        })
    }
})

task('serve', [], async () => {
    const fuse = FuseBox.init({
        output: 'dist',
    })
    fuse.dev({
        root: 'dist',
    })
    await fuse.run()
})

task('document', async () => {
    //    const configuration = context.getConfig()
    //    console.dir(context.getConfig().context.tsConfig)
    //    process.exit()
    console.log(project == null)
    if (project) { // Project may not have converted correctly
        const outputDir = 'docs2'
        // Rendered docs
        await app.generateDocs(project, outputDir)
    }
})
