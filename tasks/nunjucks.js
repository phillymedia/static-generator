var nunjucksRender = require('gulp-nunjucks-render');
var replace = require('gulp-replace');
var data = require("gulp-data");
var fs = require('fs');
var index = fs.readdirSync("src/galleries");

var galdata = {};

module.exports = function(gulp, plugins) {
    return function() {
        return gulp.src('src/index.html')

            .pipe(data(function() {

                index.forEach(function(page) {
                    var name = page.replace(".json","");
                    if(!galdata[name]) galdata[name] = require(`./../src/galleries/${page}`);
                })

                return {
                    gallerydata: galdata
                }
            }))


            .pipe(nunjucksRender({
                path: ['src']
            }))
            .pipe(replace('http://media.philly.com/storage/inquirer/CustomShareTools/CustomShareToolsD.js', './js/CustomShareToolsD.js'))
            .pipe(replace('http://media.philly.com/storage/inquirer/script/LongformBootstrapCarouselE.js', ''))
            .pipe(replace('http://media.philly.com/storage/inquirer/Longform/Bootstrap/js/bootstrap.min.js', './js/bootstrap.min.js'))
            .pipe(replace('http://media.philly.com/storage/inquirer/script/custom-bootstrap-styles/css/bootstrap.css', './css/bootstrap.css'))
            .pipe(replace('//cloud.typography.com/7722894/765348/css/fonts.css', ""))
            .pipe(replace('//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap-glyphicons.css', 'http://netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap-glyphicons.css'))
            .pipe(replace(/<div id="div-gpt-ad-mrec[\s\S]*?<\/div>/g, ''))
            .pipe(replace(/<div alignment="true" id="div-gpt-ad-mrec[\s\S]*?<\/div>/g, ''))

            .pipe(replace(`$('#recircSpecials').load('/philly/news/special_packages/390291181.html  #morereports');`, ""))
            .pipe(replace('$("#recircSpecials").load("/philly/news/special_packages/390291181.html  #morereports")', ''))
            .pipe(replace(`$('#recircSpecials').load('/philly/news/special_packages  #morereports');`, ''))

            .pipe(replace(`<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous" />`, `<link rel="stylesheet" href="./css/bootstrap.css" />`))

            .pipe(replace("'Gotham Narrow SSm A','Gotham Narrow SSm B',", "Roboto,"))
            .pipe(replace("'Sentinel SSm A','Sentinel SSm B',", "IBM Plex Serif,"))


            .pipe(gulp.dest('.tmp'))
            .pipe(plugins.browserSync.reload({
                stream: true
            }))


        // doc.getRows(1, function(err, rows) {
        //     rows.forEach(function(row) {
        //         sheet1Old.push({"pageorder":row.pageorder, "pagename":row.pagename, "category":row.category})
        //     })
        //
        //     gulp.src('src/pages/*.+(html)')
        //         .pipe(data(function() {
        //             return {
        //                 sheet1Old: sheet1Old
        //             }
        //         }))
        //         .pipe(nunjucksRender({
        //             path: ['src/components']
        //         }))
        //         .pipe(gulp.dest('.tmp'))
        //         .pipe(plugins.browserSync.reload({
        //             stream: true
        //         }))
        //
        // });
    };
};
