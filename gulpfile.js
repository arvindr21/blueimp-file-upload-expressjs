var gulp            = require('gulp'),
    jshint          = require('gulp-jshint'),
    jshintStylish   = require('jshint-stylish'),
    pkg             = require('./package.json');

gulp.task('lint',function(){

    return gulp.src(['index.js','lib/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(jshintStylish));	

});

gulp.task('watch', function() {
    gulp.watch(['lib/**/*.js','index.js'],['lint']);
});


gulp.task('default', ['lint','watch']);
