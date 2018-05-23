var browserify = require('browserify');
var source = require('vinyl-source-stream');
var stringify = require('stringify');
var buffer = require('vinyl-buffer');
var babelify = require("babelify");


module.exports = function(gulp, plugins) {
    return function() {
        return browserify({
                'entries': ['src/js/main.js']
            })
            .transform(stringify, {
                appliesTo: {
                    includeExtensions: ['.html']
                }
            })
            .transform(babelify, {
                presets: ["es2015"]
            })
            .bundle()
            .pipe(source('main.js'))
            .pipe(buffer())
            .pipe(gulp.dest('.tmp/js'))
            .pipe(plugins.browserSync.reload({
                stream: true
            }))
    };
};
