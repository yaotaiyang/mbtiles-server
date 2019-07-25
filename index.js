const Koa = require('koa');
const path = require("path");
const fs = require("fs");
const MBTiles = require("@mapbox/mbtiles");

// 注意require('koa-router')返回的是函数:
const router = require('koa-router')();
// 注意require('koa-router')返回的是函数:

const app = new Koa();

// log request URL:
app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
    await next();
});

// add url-route:
router.get('/:s/',async (ctx,next) =>{
    if (fs.existsSync('mbtiles/'+ctx.params.s + ".mbtiles")) {
      let filePath = path.join(__dirname,'mbtiles',ctx.params.s+'.mbtiles');
      let info = await getInfo(filePath);
      ctx.response.body = info;
    }else {
        ctx.response.body = '404';
      }
})
router.get('/:s/:z/:x/:y.:t', async (ctx, next) => {
    if (fs.existsSync('mbtiles/'+ctx.params.s + ".mbtiles")) {
        let filePath = path.join(__dirname,'mbtiles',ctx.params.s+'.mbtiles');
        let tile = await getTile(filePath,ctx.params.x,ctx.params.y,ctx.params.z);
        if(tile){
            let header = getContentType(ctx.params.t);
            ctx.set(header);
            ctx.response.body = tile;
        }

    }else {
        ctx.response.body = '404';
      }
});

router.get('/', async (ctx, next) => {
  ctx.body = '<h1>WellCome to mbtile-server</h1>';
});

// add router middleware:
app.use(router.routes());

app.listen(3000);
console.log('app started at port 3000...');

function getTile(dir,x,y,z){
    return new Promise((resove,reject)=>{
        new MBTiles(dir, function (err,mbtiles) {
            if (err) {
              reject(err);
            } else {
              mbtiles.getTile(z, x, y, function (err,tile,headers) {
                if (err) {
                  reject(err)
                } else {
                    resove(tile);
                }
              });
            }
        });
    })
}

function getInfo(dir){
    return new Promise((resove,reject)=>{
        new MBTiles(dir, function (err,mbtiles) {
            if (err) {
              reject(err);
            } else {
              mbtiles.getInfo(function (err,tile,headers) {
                if (err) {
                  reject(err)
                } else {
                    resove(tile);
                }
              });
            }
        });
    })
}

function getContentType(t) {
    var header = {};
    // CORS
    header["Access-Control-Allow-Origin"] = "*";
    header["Access-Control-Allow-Headers"] =
      "Origin, X-Requested-With, Content-Type, Accept";
    // Cache
    header["Cache-Control"] = "public, max-age=604800";
    // request specific headers
    if (t === "png") {
      header["Content-Type"] = "image/png";
    }
    if (t === "jpg" || t === "jpeg") {
      header["Content-Type"] = "image/jpeg";
    }
    if (t === "pbf") {
      header["Content-Type"] = "application/x-protobuf";
      header["Content-Encoding"] = "gzip";
    }
    return header;
  }