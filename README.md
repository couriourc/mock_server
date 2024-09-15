## SimpleMockServer

<p align="center">
  <a href="https://ruffle.rs"><img src="./docs/logo.jpg" style="margin: 0 auto;border-radius: 20px;"/></a>
</p>
<p align="center">
  <br />
  <strong>
    <a href="./example">Demo</a> |
    <a href="https://github.com/couriourc/mock_server/releases">nightly builds</a> | 
    <a href="https://github.com/couriourc/mock_server/example">Example</a> | 
    <a href="https://github.com/couriourc/mock_server/wiki">wiki</a>
  </strong>
</p>


<div align="center">
  
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/couriourc/mock_server/Builder?label=build&style=flat-square)
[![Node version](https://img.shields.io/node/v/@couriourc/simple-mock.svg?style=flat)](https://www.npmjs.com/package/@couriourc/simple-mock)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/couriourc/simple-mock_server/issues)

</div>

## Introduction

There is a most simple mock server use file organization, just drag your file, and rm your filename,and u got a
server;

## Direct use

[Download the bin version ->](https://github.com/couriourc/mock_server/releases/tag/release)

startup your download application,and it will auto create directories named `static`,`apis`, and then will start a
server,
Place the folder that requires Mock in the apis directory, and then start the service, where the api rule is, the
directory determines the prefix,`[api_suffix]. [api_method]
.json`, where api_suffix represents the api path, api_method represents the interception method, and
supports `get| post| patch| head| delete| option| put`
, this is just to keep the results consistent. Index.json is automatically intercepted here as`/`.

## Features

- Returns static JSON data
- Returns based on interface information
- Generated based on the Mock template, see http://mockjs.com/examples.html
  Here, a {{}} writing similar to Vue is supported, and the replaced result is converted using Mockjs, which means that
  random data is generated through json. We provided the 'cookie', 'user-agent', 'headers', 'body', 'route', 'query', '
  content-type',just like {{headers.contentType}} or {{query.key1}}

## Example

```txt
PS D:\projects\mock_server> tree .\example\ /f
│  .simple-mock.yaml
│  [SimpleMockServer] your download application
├─apis
│  └─api
│      │  index.delete.json
│      │  index.get.json
│      │  index.json
│      │  index.option.json
│      │  index.patch.json
│      │  index.post.json
│      │  querybyentity.json
│      │
│      └─index
│              test.json
│
├─plugins
│  └─peer-stream
│      │  index.js
│      │  package.json
│      │  pnpm-lock.yaml
│      └─node_modules
└─static
        bootstrap.min.css
        index.html
        jquery.min.js
        normalize.css

```

```txt
┌───────┬───────────────────┬────────┬─────────────────────────────┐
│ index │ url               │ method │ file                        │
├───────┼───────────────────┼────────┼─────────────────────────────┤
│     1 │ api/              │ delete │ apis\api\index.delete.json  │
│     2 │ api/              │ get    │ apis\api\index.get.json     │
│     3 │ api/              │ get    │ apis\api\index.json         │
│     4 │ api/              │ option │ apis\api\index.option.json  │
│     5 │ api/              │ patch  │ apis\api\index.patch.json   │
│     6 │ api/              │ post   │ apis\api\index.post.json    │
│     7 │ api/querybyentity │ get    │ apis\api\querybyentity.json │
│     8 │ api/index/test    │ get    │ apis\api\index\test.json    │
└───────┴───────────────────┴────────┴─────────────────────────────┘
```

and you can fetch `/api` to access content of `apis\api\index.delete.json`

## Plugins

We also offer a plugin system to extend it, I am writing wiki
### Swagger
The Swagger plugin is pre-installed in the project and can be seen directly by visiting /swagger.
![image](https://github.com/user-attachments/assets/9ca5ce8b-f113-4193-a991-28054d4341ff)

>  ❤️ Many thanks to Elysia for the handy and nice ui . https://github.com/elysiajs/elysia-swagger

### Cors
Handles cross-domain issues and can give XHR direct access to Mock's APIs

all of plugins can configuration by set field `plugins` of `.simple_mock.yaml` 

```diff

root_dir: .
api_dir: apis
static_dir: static
static_route_prefix: /
port: 3000
silent:
error_log_file_path: ./error.log
log_size: 10M
debug_log_file_path: ./debug.log
watch:
+ plugins:
+  swagger:
+  cors: 
  
rewrites:
  - path: ''
    test: ^(index)$

```

## Configuration

Please see [ source code ](https://github.com/couriourc/mock_server),[WIP]

## Check list

- [ x ] Plugin Loaded
- [ x ] Support Static HTML to deploy
- [ x ] Mock JSON by filename
- [ ] WIKI

## Thank You!
Help spread the Code Quality Love! ❤️
