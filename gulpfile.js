var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require("del");
var inquirer = require('inquirer');
var rename = require("gulp-rename");
var fileName;

plugins.runSequence = require('run-sequence');
plugins.browserSync = require('browser-sync').create();
plugins.gulpIf = require('gulp-if');

function getTask(task) {
    return require('./tasks/' + task)(gulp, plugins);
}

gulp.task('css', getTask('css'));
gulp.task('browserSync', getTask('browserSync'));
gulp.task('nunjucks', getTask('nunjucks'));
gulp.task('indexcleanup', getTask('indexcleanup'));
gulp.task('browserify', getTask('browserify'));
gulp.task('uglify', getTask('uglify'));
gulp.task('cssnano', getTask('cssnano'));
gulp.task('inline', getTask('inline'));

gulp.task('copyjs', function() {
    return gulp.src([
        'src/project/*.js',
        'src/js/*.js',
        '!src/js/main.js'
    ]).pipe(gulp.dest('.tmp/js')).pipe(plugins.browserSync.reload({
        stream: true
    }))
});

gulp.task('clean', function(cb) {
    del([
        'dist/inline/**', 'dist/index.html'
    ], cb)
})

gulp.task('inq', function(done) {
    var questions = [{
        type: 'input',
        name: 'file_name',
        message: 'What is the project file name?'
    }];
    inquirer.prompt(questions).then(function(answers) {
        JSON.stringify(answers, null, '  ')
        fileName = answers.file_name.replace(/ /g, "_");

        done();
    });
})

gulp.task('setName', function() {
    return gulp.src("dist/index.html").pipe(rename(function(path) {
        path.basename = fileName;
        path.extname = ".html"
    })).pipe(gulp.dest("dist"));
})

gulp.task('watch', [
    'browserSync', 'nunjucks'
], function() {
    gulp.watch('src/**/*.css', ['css']);
    gulp.watch('src/**/**/*.html', ['nunjucks']);
    gulp.watch('src/js/*.+(js|html)', ['browserify', 'copyjs']);
});

gulp.task('default', function(callback) {
    plugins.runSequence([
        'css',
        'copyjs',
        'browserify',
        'nunjucks',
        'browserSync',
        'watch'
    ], callback)
})

gulp.task('build', function(callback) {
    plugins.runSequence('inq', [
        'css', 'copyjs', 'browserify', 'nunjucks'
    ], 'cssnano', 'inline', 'indexcleanup', 'setName', 'clean', callback)

})
