var Path = require('path');
var fs = require("fs");
var exec = require('child_process').exec;

function start() {
  
  var readOrWriteFile = function(path, file, content) {
    var contentFile = null;
    try {
      contentFile = fs.readFileSync(file).toString();
    } catch(err) {
      try {
        fs.mkdirSync(path);  
      } catch(e) {}
      fs.writeFileSync(file, "{}");
      contentFile = fs.readFileSync(file).toString();
    }
    return contentFile;
  }

  var readOrElse = function(file, content) {
    try {
      content = fs.readFileSync(file).toString();
    } catch(err) {}
    return content;
  }

  var basePath = Path.resolve(".");
  var settings = JSON.parse(fs.readFileSync(basePath + '/package.json')).settings.i18n || {};
  
  var languages = settings.languages || ['en'],
      blacklist = settings.blacklist || [".git", "libraries", "stylesheets", "icons", "core"],
      files = settings.files || ["js", "html", "hbs"];

  var results = [];
  var walk = function(dir){
    var paths = fs.readdirSync(dir);
    paths.forEach(function(path){
      if( blacklist.indexOf(path) === -1 ){
        var dirpath = Path.join(dir, path);
        var stat = fs.statSync(dirpath);
        if( stat.isDirectory() ){
          walk(dirpath)
        }else if( stat.isFile() ){
          files.forEach(function(pattern){
            var reg = new RegExp(pattern+"$");
            if( dirpath.match(reg) ){
              results.push(dirpath);  
            }
          });
        }
      }
    });
  };
  walk(basePath);

  var i = 0;
  var strings = {};
  results.forEach(function(file){
    i++;
    var content = fs.readFileSync(file).toString();
    var matcher = function(regExp) {
      while(match = regExp.exec(content) ){
        if( match[1] ){
          strings[match[1]] = "";
        }
      }
    };
    [ new RegExp("\{\{ {0,}\_\_ {1,}\"([^\"]{1,})\" {0,}\}\}", "g"),
      new RegExp("\{\{ {0,}\_\_ {1,}\'([^\']{1,})\' {0,}\}\}", "g"),
      /__\(\"([^\"]{1,})\"\)/g,
      /__\(\'([^\'']{1,})\'\)/g,
    ].forEach(function(regExp) {
      matcher(regExp);
    });
    
  });

  console.info('i18n files export finished');
  console.info('=============================================');

  languages.forEach(function(language){

    var dir = Path.join(basePath, "languages");
    var languageFile = Path.join(dir, language + ".json");
    var contentFile = readOrWriteFile(dir, languageFile, "{}");
    
    var properties = JSON.parse(contentFile);
    for( word in strings){
      if( !properties[word] ){
        properties[word] = "";
      }
    }
  
    fs.writeFileSync(languageFile, JSON.stringify(properties, null, 2));
    console.info("Generated file -> " + languageFile);
  });

};

module.exports.builder = function(name) {
  var existsSync = fs.existsSync || Path.existsSync;
  if (!existsSync(Path.join(process.cwd(), 'package.json'))) {
    console.info('You need to be on root of your project folder.');
    return;
  }

  start();
}
