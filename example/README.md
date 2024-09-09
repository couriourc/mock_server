## SimpleMockServer

<p align="center">
  <a href="https://github.com/couriourc/mock_server"><img src="./docs/logo.jpg" style="margin: 0 auto;border-radius: 20px;"/></a>
</p>
<p align="center">
  <br />
  <strong>
    <a href="./example">demo</a> |
    <a href="https://github.com/couriourc/mock_server/releases">nightly builds</a> | 
    <a href="https://github.com/couriourc/mock_server/example">Example</a> | 
    <a href="https://github.com/couriourc/mock_server/wiki">wiki</a>
  </strong>
</p>

> 让 mock 更简单

## Why

是否还在为前端部署头疼，是否还在为部署静态服务烦恼，是否还在嫌弃 Mock
数据流程麻烦，对我而言，大多数情况，都不喜欢必须把静态数据进行强制集成到项目中，对于很多老项目也没法做这个事儿，不如试试目录式模拟，拖入到对应的文件，然后启动应用，就可以完成这个操蛋的事情。

## 使用说明

将需要 Mock 的文件夹放置在 apis 目录下，然后启动服务，其中 api 规则为，目录决定前缀，[api_suffix].[api_method]
.json,其中，api_suffix 表示 api 路径，api_method,表示拦截的方法，支持 `get|post|patch|head|delete|option|put`
，这个只是为了保持结果一致，这里自动拦截了 index.json 为 /。

## 例如

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

## 基本功能

- 返回静态JSON数据
- 根据接口信息返回
- 根据 Mock 模板生成，见  http://mockjs.com/examples.html

这里支持类似 Vue 的 {{}} 写法，并对，替换后的结果采用 Mockjs 来转换，也就是支持通过 json 生成随机数据。

文件内容为：

```json
{
  "result": "{{body.schema}}"
}
```

![alt text](docs/image.png)

以及 http://mockjs.com/examples.html，

```json
{
  "list|1-10": [
    {
      "id|+1": 1
    }
  ]
}
```

随机生成如下

![alt text](docs/randomify.png)

## 配置文件 .simple-mock.yaml

[WIP],还在写
