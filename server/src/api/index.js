import { version } from "../../package.json";
import { Router } from "express";
import { exec } from "child_process";
import uuid from "uuid/v4";
import fs from "fs";
import path from "path";


export default ({ config, db }) => {
  let api = Router();

const store = `${__dirname}/../store`;
  if (!fs.existsSync(store)){
    fs.mkdirSync(store);
}

  // perhaps expose some API metadata at the root
  api.get("/", (req, res) => {
    res.json({ version });
  });

  api.post("/compile", (req, res) => {
    const id = uuid();
    console.log(req.body.code);
    fs.writeFile(`${store}/${id}.c`, req.body.code, function(err) {
      console.error(err, "file not created");
      if (err) throw err;
      // compiles out everything
      // const command = "emcc -o hello2.html temp.c -O3 -s WASM=1"
      // https://github.com/kripken/emscripten/wiki/WebAssembly-Standalone

      const command = `emcc ${store}/${id}.c -s WASM=1 -s ASSERTIONS=1 -s SAFE_HEAP=1 -s EXIT_RUNTIME=1 -o ${store}/${id}.js`;

      // WASM=1 sets all modules
      // ASSERTIONS=1 Adds checks for memory errors (overflowing)
      // SAFE_HEAP=1 adds additional memory access checks, and will give clear errors for problems like dereferencing 0 and memory alignment issues.
      // EXIT_RUNTIME=1 terminates env after running, regardless of missing /n in printfs and other errors
      // NO_EXIT_RUNTIME=1 keeps env alive. *** NEED TO SEND FILE DOWN SOMEHOW FORMDATA BOOO***

      // Manual wasm load // NB Probs not possible for anything including libraries.
      // const command =
      //   "emcc " +
      //   __dirname +
      //   "/temp/temp.c -s WASM=1 -s SIDE_MODULE=1 -o " +
      //   __dirname +
      //   "/temp/target.wasm";
      console.log("**********************************");
      console.log("**********************************");
      console.log("**");
      console.log("** Running command:");
      console.log("**", command);
      console.log("**");
      console.log("*********************************");
      console.log("**********************************");

      exec(command, (err, stdout, stderr) => {
        // fs.unlink(`${__dirname}/temp/${id}.c`, function(err) {
        //   if (err) throw err;
        //   console.log("temp.c deleted!");
        // });
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        if (err) {
          // node couldn't execute the command
          console.error(err);
          res.json("FAILED");
          return;
        }

        res.send({ id: id });

        // res.setHeader("Content-Type", "application/wasm");

        // res.sendFile(__dirname + "/temp/target.wasm");
        // fs.unlink("./temp/target.wasm", function(err) {
        //   if (err) throw err;
        //   console.log("target.wasm deleted!");
        // });
        // the *entire* stdout and stderr (buffered)
        // res.json(stdout);
      });
    });
  });

  api.post("/getWASM", (req, res) => {
    const id = req.body.id;
    console.log(id);
    // fs.readFile(path.resolve(`${store}/${id}.wasm`), function(err, contents) {
    //   const buffer = new Buffer(contents);
    //   res.send(buffer, 'binary');
    // });
    res.sendFile(path.resolve(`${store}/${id}.wasm`));
  });

  api.post("/getJS", (req, res) => {
    const id = req.body.id;
    res.type('application/javascript');
    fs.readFile(path.resolve(`${store}/${id}.js`), 'utf8', function(err, contents) {
      console.log(contents);
      res.send({code: contents});
    });
  });

  return api;
};
