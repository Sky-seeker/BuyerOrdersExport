// ==UserScript==
// @name         淘宝买家订单导出-颜色分类-商品主图
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  基于Greasy Fork上的`淘宝买家订单导出-颜色分类`添加了`商品主图`导出，修改`商品明细`为`商品名称`等。导出的项目包括订单编号、下单日期、店铺名称、商品名称、颜色分类、商品链接、交易快照、商品主图、单价、数量、退款状态、实付款、交易状态。使用方法为登录淘宝网页版，在已买到的宝贝页面会增加两个按钮。点击`添加本页订单`即可将当前页订单添加到保存的订单列表中。点击`下一页`后再次点击`添加本页订单`，重复此操作直至最后一页，点击`导出订单`即可导出所有的订单记录为CSV文件。
// @author       Sky-seeker
// @match        https://buyertrade.taobao.com/trade/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.15/lodash.min.js
// @grant        none
// @license      MIT
// @supportURL   https://greasyfork.org/zh-CN/scripts/
// ==/UserScript==

function addButton(element, onclickFunc, value = "按钮", width = "60px", height = "60px") {
    const button = document.createElement("input");
    button.type = "button";
    button.value = value;
    button.style.height = height;
    button.style.width = width;
    button.style.align = "center";
    button.style.marginBottom = "10px";
    button.style.marginLeft = "250px";
    button.style.color = "white";
    button.style.background = "#409EFF";
    button.style.border = "1px solid #409EFF";

    button.onclick = function () {
        onclickFunc();
    }

    element.appendChild(button);
    element.insertBefore(button, element.childNodes[0]);
}

const orderListPage = /(http|https):\/\/buyertrade\.taobao.*?\/trade/g;
if (orderListPage.exec(document.URL)) {
    const orderListMain = document.getElementById("J_bought_main");
    addButton(orderListMain, addCurrentPageOrdersToList, "添加本页订单", "160px");
    addButton(orderListMain, exportOrders, "导出订单", "160px");
}

function toCsv(header, data, filename) {
    let rows = "";
    let row = header.join(",");
    rows += row + "\n";

    _.forEach(data, value => {
        rows += _.replace(value.join(","), '#', '@') + "\n";
    })

    let blob = new Blob(["\ufeff" +rows],{type: 'text/csv;charset=utf-8;'});
    let encodedUrl = URL.createObjectURL(blob);
    let url = document.createElement("a");
    url.setAttribute("href", encodedUrl);
    url.setAttribute("download", filename + ".csv");
    document.body.appendChild(url);
    url.click();
}

let orderList = {}
function addCurrentPageOrdersToList() {
    const orders = document.getElementsByClassName("js-order-container");

    for (let order of orders) {

        let items = processOrder(order);

        if (!items) {
            continue;
        }

        _.forEach(items, (value, key) => {
            orderList[key] = value;
        })
    }
}

function exportOrders() {

    const header = ["订单编号", "下单日期", "店铺名称", "商品名称", "颜色分类", "商品链接", "交易快照", "商品主图", "单价", "数量", "退款", "实付款", "交易状态"];

    toCsv(header, orderList, "淘宝订单导出")
}

function processOrder(order) {

    let outputData = {};
    let textContent = order.textContent;
    let pattern = /(\d{4}-\d{2}-\d{2})订单号: ()/;
    let isExist = pattern.exec(textContent);

    if (!isExist) {
        console.log('暂未发现订单！');
    }else{
        const date = isExist[1];
        const id = order.querySelector("div[data-id]").getAttribute("data-id");

        let index = 0;

        while (true) {
            let shopQuery = document.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:0.0.1.0.1']");
            let productQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.0.0.1']");
            let colorsQuery = order.querySelector("p[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.1']");
            let priceQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$1.0.1.1']");
            let countQuery = order.querySelector("p[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$2.0.0']");
            let refundQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$3.0.$0.0.$text']");
            let actualPayQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$4.0.0.2.0.1']");
            let itemUrlQuery = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.0.0']");
            let snapshotUrlQuery = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.0.1']");
            let imageUrlQuery = order.querySelector("img[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.0.0.0']");

            if (productQuery === null) {
                break;
            }

            let shop = shopQuery === null ? "" : shopQuery.innerText;
            let colors = colorsQuery === null ? "" : colorsQuery.innerText;
            let price = priceQuery === null ? "" : priceQuery.textContent;
            let count = countQuery === null ? "" : countQuery.textContent;
            let refund = refundQuery === null ? "" : refundQuery.innerText === "查看退款" ? "退款" : "";

            if (actualPayQuery != null) {
                var actualPay = actualPayQuery.textContent;
            }

            if (index === 0) {
                let statusQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$5.0.0.0']");
                var status = statusQuery.textContent;
            }

            let itemUrl = itemUrlQuery === null ? "" : itemUrlQuery.href;
            let snapshotUrl = snapshotUrlQuery === null ? "" : snapshotUrlQuery.href;
            let imageUrl = imageUrlQuery === null ? "" : imageUrlQuery.src;

            index++;

            outputData[id + index] = [
                id,
                date,
                shop,
                productQuery.textContent.replace(/,/g,"，"),
                colors,
                itemUrl,
                snapshotUrl,
                imageUrl,
                parseFloat(price),
                count,
                refund,
                actualPay,
                status,
            ]
        }
    }
    return outputData;
}