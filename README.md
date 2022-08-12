# LuciferDeploy
Lucifer发布工具，主要是将.Net Core项目进行打包，发送到服务器，进行镜像创建，然后运行容器。

## 使用到的技术
- electron
- nodejs
- javascript
- layui
- pnpm

## 使用方法
使用说明：该项目主要用于C#的项目以Docker容器的形式进行发布，还有直接将文件夹发布到服务器上
注意：第一次使用需要在服务器上创建对应的文件夹

### 安装依赖
pnpm i
### 启动项目
pnpm start
### 生成mac app
pnpm build-mac-x64
### 生成mac m1 app
pnpm build-mac-m1
### 生成window app
pnpm build-win


