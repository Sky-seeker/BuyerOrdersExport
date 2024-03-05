# 淘宝买家订单数据导出

## 简介

- “淘宝买家订单数据导出”最初基于“淘宝买家订单导出-颜色分类”添加了“商品主图”，修改和修复了一些细节问题，当前版本与之前已经有了较大的变动。导出的项目包括订单编号、下单日期、店铺名称、商品名称、商品颜色分类、商品主图链接、商品链接、商品交易快照链接、单价、数量、退款状态、订单实付款、订单交易状态、订单详情链接、快照商品名称，导出的订单数据为CSV文件。在导出淘宝买家订单数据时，可以设置商品名黑名单过滤关键字和快照商品名称获取随机延时。使用的过程中会有反馈，如按钮的可用状态和颜色变化，以及窗口右下角的气泡通知。

## 安装

1. 安装对应浏览器的脚本管理器
   - Chrome：[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox：[Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)
   - Safari：[Tampermonkey](http://tampermonkey.net/?browser=safari)
   - Microsoft Edge：[Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. 在 **Greasy Fork** 搜索并安装此脚本。或者在 **github** 下载本项目的 zip 文件，解压后将压缩包中的 js 文件导入到浏览器的 **Tempermonkey** 扩展中。

## 使用

1. 登录 [淘宝](https://www.taobao.com/) 网页版，点击 **我的淘宝** -> **已买到的宝贝** 查看所有订单。

2. 页面顶部会出现三个复选框和六个按钮。三个复选框分别是 *商品名黑名单过滤* 、 *快照获取随机延时* 、 *快照商品名称获取* ；六个按钮分别是 *清空黑名单列表* 、 *重置黑名单列表* 、 *设置黑名单列表* 、 *清空订单数据* 、 *导出订单数据* 、 *添加本页订单* 。

3. 点击 **添加本页订单** 按钮，将当前页的订单数据添加到待导出的订单数据中。

4. 点击 **下一页** 按钮，点击 **添加本页订单** 按钮继续添加订单数据。

5. 重复第 4 步直到最后一页，点击 **导出订单数据** 按钮即可导出所有的订单数据为CSV文件。

## 使用说明

- **黑名单过滤** : 勾选 *商品名黑名单过滤* 前的复选框启用此功能。在 *商品名称黑名单关键词* 下的文本框中输入商品名黑名单过滤关键字（每行一条），输入的黑名单关键字在点击 **设置黑名单列表** 后生效。黑名单内置的默认关键字为 *保险服务* 、 *增值服务* 、 *买家秀* ，点击 **重置黑名单列表** 可恢复黑名单关键字为默认关键字。

- **快照商品名称** : 勾选 *快照商品名称获取* 前的复选框启用此功能。淘宝订单页面显示的商品名称并不完整，启用此功能后可以通过交易快照获取完整的商品名称。但是 **此功能需要花费大量的时间，同时可能导致出现滑块验证，非必要不建议启用！**

- **快照获取随机延时** : 勾选 *快照获取随机延时* 前的复选框启用此功能。启用此功能后会降低获取快照的频率，每获取一条快照记录后会随机延时1.0~3.0S后再获取下一条记录，以降低出现人机验证的可能性。

- **添加本页订单** 按钮颜色：常规状态为蓝色；订单添加进行中为橙色；当前页订单添加完成后为绿色，单击订单区域或 **下一页** 后恢复为蓝色的常规状态。

## 注意事项

- 在导出订单之前 **不要刷新页面** ，刷新会导致已经添加的订单数据和设定的设置丢失！

- 在启用快照商品名称获取的情况下， 点击 **添加本页订单** 按钮后，此按钮会变为黄色，同时窗口右下角出现 *正在获取快照商品名称...* ，建议此时 **不要进行其它操作！** 。

- 黑名单关键字需要在添加订单之前设置。

## 声明

- 仅提取订单数据，数据临时储存于本地，不会被记录外泄。
