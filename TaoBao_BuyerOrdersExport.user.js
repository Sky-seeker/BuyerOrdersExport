// ==UserScript==
// @name         淘宝买家订单数据导出
// @namespace    https://github.com/Sky-seeker/BuyerOrdersExport
// @version      1.2
// @description  “淘宝买家订单数据导出”最初基于“淘宝买家订单导出-颜色分类”添加了“商品主图”，修改和修复了一些细节问题，当前版本与之前已经有了较大的变动。导出的项目包括订单编号、下单日期、店铺名称、商品名称、商品颜色分类、商品主图链接、商品链接、商品交易快照链接、单价、数量、退款状态、订单实付款、订单交易状态、订单详情链接、快照商品名称，导出的订单数据为CSV文件。在导出淘宝买家订单数据时，可以设置商品名黑名单过滤关键字和快照商品名称获取随机延时。使用的过程中会有反馈，如按钮的可用状态和颜色变化，以及窗口右下角的气泡通知。
// @author       梦幻之心星
// @match        https://buyertrade.taobao.com/trade/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.15/lodash.min.js
// @grant        none
// @license      MIT
// @supportURL   https://github.com/Sky-seeker/BuyerOrdersExport
// ==/UserScript==

var orderList = {};
var orderHeader = [];
var ProductNameBlackList = [];
var imageDimensionsIndex = 0;

var defaultOrderHeader = [
    "下单日期",
    "订单编号",
    "店铺名称",
    "商品名称",
    "快照商品名称",
    "商品分类",
    "商品主图",
    "商品链接",
    "交易快照",
    "单价",
    "数量",
    "实付款",
    "退款状态",
    "交易状态",
    "订单详情链接",
];
var defaultProductNameBlackList = ["保险服务", "增值服务", "买家秀"];
var imageDimensionsList = ["80x80", "100x100", "160x160", "200x200", "240x240", "300x300", "320x320", "400x400", "480x480", "560x560", "600x600", "640x640", "720x720", "800x800"];

//通知气泡默认属性
function createToast() {
    let Toast = document.createElement("div");
    let ToastText = document.createTextNode("通知气泡");

    Toast.id = "Toast";
    Toast.style.visibility = "hidden";
    Toast.style.position = "fixed";
    Toast.style.bottom = "0px";
    Toast.style.fontSize = "17px";
    Toast.style.minWidth = "200px";
    Toast.style.backgroundColor = "#4CAF50";
    Toast.style.color = "white";
    Toast.style.textAlign = "center";
    Toast.style.borderRadius = "10px";
    Toast.style.padding = "10px";
    Toast.style.zIndex = 1;
    Toast.style.right = "1%";

    Toast.appendChild(ToastText);
    document.getElementById("page").appendChild(Toast);
}

//调用通知气泡
function Toast(toastTextContent, alwaysShow = false) {
    let Toast = document.getElementById("Toast");

    Toast.style.visibility = "visible";
    Toast.textContent = toastTextContent;

    if (alwaysShow === false) {
        setTimeout(function () {
            Toast.style.visibility = "hidden";
        }, 3000);
    }
}

//文本区域默认属性
function createTextarea(element, onchangeFunc, text, id, rows) {
    let Textarea = document.createElement("TEXTAREA");
    let TextareaTitle = document.createElement("p");

    Textarea.id = id;
    Textarea.rows = rows;
    Textarea.cols = 30;
    Textarea.placeholder = "每行一条。";

    Textarea.style.width = "90px";
    Textarea.style.height = "140px";
    Textarea.style.padding = "5px";

    TextareaTitle.textContent = text;
    TextareaTitle.style.fontSize = "15px";
    TextareaTitle.style.fontWeight = 700;

    Textarea.onchange = function () {
        onchangeFunc();
    };

    element.appendChild(TextareaTitle);
    element.appendChild(Textarea);
}

//单选按钮默认属性
function addRadio(element, onchangeFunc, text, id, value) {
    const radio = document.createElement("input");
    const radioText = document.createTextNode(text);

    radio.id = id;
    radio.value = value;
    radio.type = "radio";
    radio.name = "imageDimensions";

    radio.style.verticalAlign = "middle";
    radio.style.marginLeft = "35px";
    radio.style.marginRight = "5px";

    radio.onchange = function () {
        onchangeFunc();
    };

    element.appendChild(radio);
    element.appendChild(radioText);
}

//下拉列表默认属性
function addSelect(element, text, value) {
    const ListSelectOption = document.createElement("option");

    ListSelectOption.text = text;
    ListSelectOption.value = value;

    element.add(ListSelectOption);
}

//复选框默认属性
function addCheckbox(element, onchangeFunc, text, id) {
    const checkbox = document.createElement("input");
    const checkboxText = document.createTextNode(text);

    checkbox.id = id;
    checkbox.type = "checkbox";
    checkbox.defaultChecked = true;

    checkbox.style.verticalAlign = "middle";
    checkbox.style.marginLeft = "30px";
    checkbox.style.marginRight = "5px";

    checkbox.onchange = function () {
        onchangeFunc();
    };

    element.appendChild(checkbox);
    element.appendChild(checkboxText);
}

//按钮默认属性
function addButton(element, onclickFunc, text, id, width = "180px", marginLeft = "40px") {
    const button = document.createElement("input");

    button.id = id;
    button.type = "button";
    button.value = text;
    button.style.height = "50px";
    button.style.width = width;
    button.style.align = "center";
    button.style.marginLeft = marginLeft;
    button.style.marginBottom = "20px";
    button.style.color = "white";
    button.style.background = "#409EFF";
    button.style.border = "1px solid #409EFF";

    button.style.fontSize = "16px";

    button.onclick = function () {
        onclickFunc();
    };

    element.appendChild(button);
}

//图片尺寸选择默认属性
function createImageDimensionsListSelect(element) {
    let ListTitle = document.createElement("p");
    let ListSelect = document.createElement("select");

    ListTitle.id = "imageDimensionsListTitle";
    ListTitle.textContent = "图片尺寸：";

    ListSelect.id = "imageDimensionsListSelect";
    ListSelect.name = "imageDimensions";

    ListTitle.style.float = "left";
    ListTitle.style.fontSize = "15px";
    ListTitle.style.fontWeight = 700;

    ListSelect.style.marginLeft = "5px";
    ListSelect.style.marginRight = "5px";

    //添加下拉列表项
    for (let index = 0; index < imageDimensionsList.length; index++) {
        addSelect(ListSelect, imageDimensionsList[index], imageDimensionsList[index]);
    }

    ListSelect.onchange = function () {
        choseImageDimensions();
    };

    element.appendChild(ListTitle);

    //var imageDimensionsList = ["80x80", "100x100", "160x160", "200x200", "240x240","300x300","320x320",
    //    "400x400","480x480", "560x560", "600x600","640x640", "720x720","800x800"];

    //添加单选项：常用值
    addRadio(element, changeImageDimensions, "80x80", "80x80", "80x80");
    addRadio(element, changeImageDimensions, "300x300", "300x300", "300x300");
    addRadio(element, changeImageDimensions, "560x560", "560x560", "560x560");
    addRadio(element, changeImageDimensions, "800x800", "800x800", "800x800");
    addRadio(element, changeImageDimensions, "其它", "otherImageDimensions", "otherImageDimensions");

    element.appendChild(ListSelect);
}

//在订单数据页面添加控件
const orderListPage = /(http|https):\/\/buyertrade\.taobao.*?\/trade/g;
if (orderListPage.exec(document.URL)) {
    const orderListMain = document.getElementById("J_bought_main");

    const userMain = document.createElement("div");
    const userMainText = document.createElement("span");
    const userMainList = document.createElement("ul");

    const userMainTextCol1 = document.createElement("div");
    const userMainTextCol2 = document.createElement("div");

    const userMainListRow0 = document.createElement("li");
    const userMainListRow1 = document.createElement("li");
    const userMainListRow2 = document.createElement("li");
    const userMainListRow3 = document.createElement("li");

    const userMainListRow0Form = document.createElement("form");
    const userMainListRow1Form = document.createElement("form");

    userMain.id = "userMain";
    userMainText.id = "userMainText";
    userMainList.id = "userMainList";

    userMainTextCol1.id = "userMainTextCol1";
    userMainTextCol2.id = "userMainTextCol2";

    userMainListRow0.id = "userMainListRow0";
    userMainListRow1.id = "userMainListRow1";
    userMainListRow2.id = "userMainListRow2";
    userMainListRow3.id = "userMainListRow3";

    userMainListRow0Form.id = "userMainListRow0Form";
    userMainListRow1Form.id = "userMainListRow1Form";

    orderListMain.insertBefore(userMain, orderListMain.childNodes[0]);

    userMain.appendChild(userMainText);
    userMain.appendChild(userMainList);

    userMainText.appendChild(userMainTextCol1);
    userMainText.appendChild(userMainTextCol2);

    userMainList.appendChild(userMainListRow0);
    userMainList.appendChild(userMainListRow1);
    userMainList.appendChild(userMainListRow2);
    userMainList.appendChild(userMainListRow3);

    userMainListRow0.appendChild(userMainListRow0Form);
    userMainListRow1.appendChild(userMainListRow1Form);

    createToast();

    createTextarea(userMainTextCol1, changeOrderDataItemTitle, "项目标题", "OrderDataItemTitle", 20);
    createTextarea(userMainTextCol2, changeBlackList, "黑名单关键词", "blackList", 8);

    createImageDimensionsListSelect(userMainListRow0Form);

    addCheckbox(userMainListRow1Form, changeBlackListStatus, "商品名黑名单过滤", "BlackListStatus");
    addCheckbox(userMainListRow1Form, changeDelayStatus, "快照获取随机延时", "DelayStatus");
    addCheckbox(userMainListRow1Form, changeSnapProductNameStatus, "快照商品名称获取", "SnapProductNameStatus");
    addCheckbox(userMainListRow1Form, changeDataFormatAdaptationStatus, "Excel数据格式适配", "DataFormatAdaptationStatus");

    addButton(userMainListRow2, resetBlackList, "重置黑名单列表", "resetBlackList", "140px", "20px");
    addButton(userMainListRow2, resetOrderDataItemTitle, "重置项目标题", "resetOrderDataItemTitle", "140px", "20px");
    addButton(userMainListRow2, readOrderDataItemTitle, "读取项目标题", "readOrderDataItemTitle", "140px", "20px");
    addButton(userMainListRow2, storageOrderDataItemTitle, "存储项目标题", "storageOrderDataItemTitle", "140px", "20px");

    addButton(userMainListRow3, cleanOrdersList, "清空订单数据", "cleanOrdersList");
    addButton(userMainListRow3, exportOrdersList, "导出订单数据", "exportOrdersList");
    addButton(userMainListRow3, addCurrentPageOrdersToList, "添加本页订单", "addOrdersList");

    document.getElementById("exportOrdersList").disabled = true;
    document.getElementById("exportOrdersList").style.opacity = 0.6;

    document.getElementById("cleanOrdersList").disabled = true;
    document.getElementById("cleanOrdersList").style.opacity = 0.6;

    setElementStyle();

    resetOrderDataItemTitle();
    resetBlackList();

    console.info("在订单数据页面添加按钮!");
}

//设置元素样式
function setElementStyle() {
    const userMain = document.getElementById("userMain");
    const userMainText = document.getElementById("userMainText");
    const userMainList = document.getElementById("userMainList");

    const userMainTextCol1 = document.getElementById("userMainTextCol1");
    const userMainTextCol2 = document.getElementById("userMainTextCol2");

    const userMainListRow0 = document.getElementById("userMainListRow0");
    const userMainListRow1 = document.getElementById("userMainListRow1");
    const userMainListRow2 = document.getElementById("userMainListRow2");
    const userMainListRow3 = document.getElementById("userMainListRow3");

    const imageDimensionsListTitle = document.getElementById("imageDimensionsListTitle");

    userMain.style.height = "180px";

    userMainText.style.float = "left";
    userMainText.style.width = "220px";
    userMainText.style.marginLeft = "0px";
    userMainText.style.display = "inline-block";

    userMainList.style.float = "left";
    userMainList.style.width = "620px";
    userMainList.style.marginLeft = "30px";

    userMainTextCol1.style.float = "left";
    userMainTextCol1.style.width = "100px";
    userMainTextCol1.style.marginLeft = "0px";

    userMainTextCol2.style.float = "left";
    userMainTextCol2.style.width = "100px";
    userMainTextCol2.style.marginLeft = "20px";

    userMainListRow0.style.fontSize = "14px";
    userMainListRow1.style.fontSize = "14px";

    userMainListRow0.style.height = "20px";
    userMainListRow1.style.height = "20px";

    userMainListRow0.style.marginBottom = "5px";
    userMainListRow1.style.marginBottom = "10px";

    //设置首列元素左边距为零
    document.getElementById("userMainListRow0Form").elements[0].style.marginLeft = "0";
    document.getElementById("userMainListRow1Form").elements[0].style.marginLeft = "0";
    userMainListRow2.children[0].style.marginLeft = "0";
    userMainListRow3.children[0].style.marginLeft = "0";

    //设置默认图片尺寸
    document.getElementById("800x800").checked = true;
    imageDimensionsIndex = imageDimensionsList.indexOf("800x800");
}

//重置按钮状态
function ResetButtonStatus() {
    document.getElementById("addOrdersList").style.background = "#409EFF";

    document.getElementById("tp-bought-root").removeEventListener("click", ResetButtonStatus);
}

//数据转为csv文本文件
function toCsv(header, data, filename) {
    let rows = "";
    let row = header.join(",");
    rows += row + "\n";

    _.forEach(data, (value) => {
        rows += value.join(",") + "\n";
    });

    let blob = new Blob(["\ufeff" + rows], { type: "text/csv;charset=utf-8;" });
    let encodedUrl = URL.createObjectURL(blob);
    let url = document.createElement("a");
    url.setAttribute("href", encodedUrl);
    url.setAttribute("download", filename + ".csv");
    document.body.appendChild(url);
    url.click();
}

var currentPageOrdersData = {};
//添加本页订单数据
function addCurrentPageOrdersToList() {
    const mainOrders = document.getElementsByClassName("js-order-container");

    var isEnableSnapProductName = document.getElementById("SnapProductNameStatus").checked;

    document.getElementById("addOrdersList").style.background = "#ff9800";

    currentPageOrdersData = {};

    //遍历每条订单记录
    for (let order of mainOrders) {
        let items = processOrderList(order);

        if (!items) {
            continue;
        }

        _.forEach(items, (value, key) => {
            orderList[key] = value;
            if (isEnableSnapProductName === false) {
                currentPageOrdersData[key] = value;
            }
        });

        //break; //TODO:测试单条订单记录
    }

    if (isEnableSnapProductName === false) {
        document.getElementById("addOrdersList").style.background = "#4CAF50";

        document.getElementById("tp-bought-root").addEventListener("click", ResetButtonStatus);

        Toast("添加 " + Object.keys(currentPageOrdersData).length + " 条订单,已添加 " + Object.keys(orderList).length + " 条订单。");
        console.info("添加 " + Object.keys(currentPageOrdersData).length + " 条订单,已添加 " + Object.keys(orderList).length + " 条订单。");

        console.info("本页订单数据:");
        console.info(currentPageOrdersData);
    }

    document.getElementById("exportOrdersList").disabled = false;
    document.getElementById("exportOrdersList").style.opacity = 1;

    document.getElementById("cleanOrdersList").disabled = false;
    document.getElementById("cleanOrdersList").style.opacity = 1;
}

//导出订单数据
function exportOrdersList() {
    if (getSnapShotProductNameCount !== 0) {
        alert("请等待添加成功后再导出！");
        return;
    }

    var dateTime = new Date();

    var dateTimeFullMonth = dateTime.getMonth() + 1;
    var dateTimeFullDay = dateTime.getDate();
    var dateTimeFullHours = dateTime.getHours();
    var dateTimeFullMinutes = dateTime.getMinutes();
    var dateTimeFullSeconds = dateTime.getSeconds();

    dateTimeFullMonth = dateTimeFullMonth < 10 ? "0" + dateTimeFullMonth : dateTimeFullMonth;
    dateTimeFullDay = dateTimeFullDay < 10 ? "0" + dateTimeFullDay : dateTimeFullDay;
    dateTimeFullHours = dateTimeFullHours < 10 ? "0" + dateTimeFullHours : dateTimeFullHours;
    dateTimeFullMinutes = dateTimeFullMinutes < 10 ? "0" + dateTimeFullMinutes : dateTimeFullMinutes;
    dateTimeFullSeconds = dateTimeFullSeconds < 10 ? "0" + dateTimeFullSeconds : dateTimeFullSeconds;

    const dateStr = dateTime.getFullYear() + "-" + dateTimeFullMonth + "-" + dateTimeFullDay;
    const timeStr = dateTimeFullHours + "-" + dateTimeFullMinutes + "-" + dateTimeFullSeconds;
    const filename = "淘宝买家订单数据导出_" + dateStr + "_" + timeStr;

    toCsv(orderHeader, orderList, filename);
}

//清空订单数据
function cleanOrdersList() {
    let count = Object.keys(orderList).length;
    orderList = {};

    Toast("清空了: " + count + " 条订单数据!");
    console.info("清空了: " + count + " 条订单数据!");
}

//存储项目标题
function storageOrderDataItemTitle() {
    if (typeof Storage !== "undefined") {
        localStorage.clear();

        for (let index = 0; index < orderHeader.length; index++) {
            localStorage.setItem("orderHeader_" + index, orderHeader[index]);
        }

        Toast("存储项目标题到本地！");
        console.info("存储项目标题到本地！");
        console.info("orderHeader[" + orderHeader.length + "]:" + orderHeader);
        console.info("orderHeader[" + localStorage.length + "]:");
        console.info(localStorage);
    } else {
        alert("你的浏览器不支持网页存储！");
        Toast("你的浏览器不支持网页存储！");
        console.info("你的浏览器不支持网页存储！");
    }
}

//读取项目标题
function readOrderDataItemTitle() {
    if (typeof Storage !== "undefined") {
        var textareaContent = "";
        var localStorageData = null;
        var index = 0;

        orderHeader = [];

        for (index = 0; index < localStorage.length; index++) {
            localStorageData = localStorage.getItem("orderHeader_" + index);

            if (localStorageData !== null) {
                orderHeader[index] = localStorageData;
                textareaContent = textareaContent + localStorageData + "\n";
            }
        }

        document.getElementById("OrderDataItemTitle").value = textareaContent;

        Toast("读取项目标题到脚本！");
        console.info("读取项目标题到脚本！");
        console.info("orderHeader[" + orderHeader.length + "]:" + orderHeader);
        console.info("orderHeader[" + localStorage.length + "]:");
        console.info(localStorage);
    } else {
        alert("你的浏览器不支持网页存储！");
        Toast("你的浏览器不支持网页存储！");
        console.info("你的浏览器不支持网页存储！");
    }
}

//改变项目标题
function changeOrderDataItemTitle() {
    var textareaContent = document.getElementById("OrderDataItemTitle").value;
    var OrderDataItemTitleList = null;

    if (textareaContent.search(/\S/) === -1) {
        textareaContent = "";

        for (let index = 0; index < orderHeader.length; index++) {
            textareaContent = textareaContent + orderHeader[index] + "\n";
        }

        document.getElementById("OrderDataItemTitle").value = textareaContent;

        alert("项目标题不能为空！");
        Toast("项目标题不能为空!");
        console.info("项目标题不能为空!");
    } else {
        orderHeader = [];
        textareaContent = textareaContent + "\n";
        OrderDataItemTitleList = textareaContent.match(/\S+\n/g);
        textareaContent = "";

        for (let index = 0; index < OrderDataItemTitleList.length; index++) {
            orderHeader[index] = OrderDataItemTitleList[index].replace("\n", "");
            textareaContent = textareaContent + OrderDataItemTitleList[index];
        }

        document.getElementById("OrderDataItemTitle").value = textareaContent;

        Toast("修改项目标题!");
        console.info("修改项目标题!");
        console.info("orderHeader[" + OrderDataItemTitleList.length + "]:" + orderHeader);
    }
}

//重置项目标题
function resetOrderDataItemTitle() {
    document.getElementById("OrderDataItemTitle").value = "";
    var textareaContent = "";
    orderHeader = [];

    for (let index = 0; index < defaultOrderHeader.length; index++) {
        orderHeader[index] = defaultOrderHeader[index];
        textareaContent = textareaContent + defaultOrderHeader[index] + "\n";
    }

    document.getElementById("OrderDataItemTitle").value = textareaContent;

    Toast("重置项目标题!");
    console.info("重置项目标题!");
    console.info("orderHeader[" + orderHeader.length + "]:" + orderHeader);
}

//改变黑名单列表
function changeBlackList() {
    var textareaContent = document.getElementById("blackList").value;
    var blackList = null;

    if (textareaContent.search(/\S/) === -1) {
        document.getElementById("blackList").value = "";
        ProductNameBlackList = [];

        Toast("清空黑名单列表!");
        console.info("清空黑名单列表!");
        console.info("ProductNameBlackList:" + ProductNameBlackList);
    } else {
        ProductNameBlackList = [];
        textareaContent = textareaContent + "\n";
        blackList = textareaContent.match(/\S+\n/g);
        textareaContent = "";

        for (let index = 0; index < blackList.length; index++) {
            ProductNameBlackList[index] = blackList[index].replace("\n", "");
            textareaContent = textareaContent + blackList[index];
        }

        document.getElementById("blackList").value = textareaContent;

        Toast("设置黑名单列表!");
        console.info("设置黑名单列表!");
        console.info("ProductNameBlackList[" + ProductNameBlackList.length + "]:" + ProductNameBlackList);
    }
}

//重置黑名单列表
function resetBlackList() {
    document.getElementById("blackList").value = "";
    var textareaContent = "";
    ProductNameBlackList = [];

    for (let index = 0; index < defaultProductNameBlackList.length; index++) {
        ProductNameBlackList[index] = defaultProductNameBlackList[index];
        textareaContent = textareaContent + defaultProductNameBlackList[index] + "\n";
    }

    document.getElementById("blackList").value = textareaContent;

    Toast("重置黑名单列表!");
    console.info("重置黑名单列表!");
    console.info("ProductNameBlackList[" + ProductNameBlackList.length + "]:" + ProductNameBlackList);
}

//启用/禁用 商品名黑名单过滤
function changeBlackListStatus() {
    let BlackListStatus = document.getElementById("BlackListStatus").checked;

    if (BlackListStatus === true) {
        document.getElementById("cleanBlackList").disabled = false;
        document.getElementById("cleanBlackList").style.opacity = 1;

        document.getElementById("resetBlackList").disabled = false;
        document.getElementById("resetBlackList").style.opacity = 1;

        document.getElementById("setBlackList").disabled = false;
        document.getElementById("setBlackList").style.opacity = 1;

        Toast("启用商品名黑名单过滤!");
        console.info("启用商品名黑名单过滤!");
    } else {
        document.getElementById("cleanBlackList").disabled = true;
        document.getElementById("cleanBlackList").style.opacity = 0.6;

        document.getElementById("resetBlackList").disabled = true;
        document.getElementById("resetBlackList").style.opacity = 0.6;

        document.getElementById("setBlackList").disabled = true;
        document.getElementById("setBlackList").style.opacity = 0.6;

        Toast("禁用商品名黑名单过滤!");
        console.info("禁用商品名黑名单过滤!");
    }
}

//启用/禁用 快照获取随机延时
function changeDelayStatus() {
    let DelayStatus = document.getElementById("DelayStatus").checked;

    if (DelayStatus === true) {
        Toast("启用快照获取随机延时1.0~3.0S!");
        console.info("启用快照获取随机延时1.0~3.0S!");
    } else {
        Toast("禁用快照获取随机延时!");
        console.info("禁用快照获取随机延时!");
    }
}

//启用/禁用 快照商品名称获取
function changeSnapProductNameStatus() {
    let SnapProductNameStatus = document.getElementById("SnapProductNameStatus").checked;

    if (SnapProductNameStatus === true) {
        Toast("启用快照商品名称获取!");
        console.info("启用快照商品名称获取!");
    } else {
        Toast("禁用快照商品名称获取!");
        console.info("禁用快照商品名称获取!");
    }
}

//启用/禁用 Excel数据格式适配
function changeDataFormatAdaptationStatus() {
    let DataFormatAdaptationStatus = document.getElementById("DataFormatAdaptationStatus").checked;

    if (DataFormatAdaptationStatus === true) {
        Toast("启用Excel数据格式适配!");
        console.info("启用Excel数据格式适配!");
    } else {
        Toast("禁用Excel数据格式适配!");
        console.info("禁用Excel数据格式适配!");
    }
}

// 改变图片尺寸大小
function changeImageDimensions() {
    var radios = document.getElementsByName("imageDimensions");
    for (let index = 0; index < radios.length; index++) {
        if (radios[index].checked) {
            var imageDimensionsListIndex = imageDimensionsList.indexOf(radios[index].value);
            var ListSelect = document.getElementById("imageDimensionsListSelect");

            if (radios[index].value !== "otherImageDimensions") {
                if (imageDimensionsListIndex !== -1) {
                    imageDimensionsIndex = imageDimensionsListIndex;
                }
            } else {
                imageDimensionsIndex = ListSelect.selectedIndex;
            }

            console.log("radios index: " + index + ";    radios value: " + radios[index].value);
            console.log("Selected Value: " + ListSelect.value + ";    Selected Text: " + ListSelect.options[ListSelect.selectedIndex].text);
            console.log("imageDimensions index: " + imageDimensionsIndex + "    image dimensions: " + imageDimensionsList[imageDimensionsIndex]);

            break;
        }
    }
}

// 监听下拉列表的变化，改变图片尺寸大小
function choseImageDimensions() {
    var ListSelect = document.getElementById("imageDimensionsListSelect");

    if (document.getElementById("otherImageDimensions").checked === true) {
        imageDimensionsIndex = ListSelect.selectedIndex;
    }

    var selectedValue = ListSelect.value; // 获取选中的值
    var selectedText = ListSelect.options[ListSelect.selectedIndex].text; // 获取选中的文本

    console.log("Selected Value: " + selectedValue + ";    Selected Text: " + selectedText);
    console.log("imageDimensions index: " + imageDimensionsIndex + "    image dimensions: " + imageDimensionsList[imageDimensionsIndex]);
}

var orderDataIndexListCount = 0;
var orderDataIndexList = [];
var getSnapShotProductNameCount = 0;
var orderListSnapShotProductName = {};
//获取快照商品名称
function getSnapShotProductName(snapShotUrl, orderDataIndex) {
    var randomTimeout = 0;
    var isenableDelay = document.getElementById("DelayStatus").checked;
    var orderDataItemIndex = orderHeader.indexOf("快照商品名称");

    if (isenableDelay === true) {
        let min = 1000; //毫秒
        let max = 3000; //毫秒
        randomTimeout = Math.round(Math.random() * (max - min)) + min;
    }

    orderDataIndexList[orderDataIndexListCount] = orderDataIndex;
    orderDataIndexListCount++;

    Toast("正在获取快照商品名称...", true);
    console.info("正在获取快照商品名称...");

    setTimeout(function () {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                orderListSnapShotProductName[orderDataIndex] = this.responseText.match(/<title>(.*)<\/title>/)[1];

                getSnapShotProductNameCount--;
                //console.info("快照商品名称:" + orderListSnapShotProductName[orderDataIndex]);

                if (getSnapShotProductNameCount === 0) {
                    document.getElementById("addOrdersList").style.background = "#4CAF50";

                    document.getElementById("tp-bought-root").addEventListener("click", ResetButtonStatus);

                    let element = document.createElement("span");
                    _.forEach(orderListSnapShotProductName, (value, index) => {
                        element.innerHTML = value;
                        element.innerHTML = element.innerHTML.replace(/&amp;([a-zA-Z]*)/g, "&$1");
                        element.innerHTML = element.innerHTML.replace(/,/g, "，");

                        orderListSnapShotProductName[index] = element.innerText;
                        orderList[index][orderDataItemIndex] = orderListSnapShotProductName[index];
                    });
                    element.remove();

                    _.forEach(orderDataIndexList, (value) => {
                        currentPageOrdersData[value] = orderList[value];
                    });

                    orderDataIndexListCount = 0;
                    orderDataIndexList = [];

                    Toast("添加 " + Object.keys(currentPageOrdersData).length + " 条订单,已添加 " + Object.keys(orderList).length + " 条订单。");
                    console.info("添加 " + Object.keys(currentPageOrdersData).length + " 条订单,已添加 " + Object.keys(orderList).length + " 条订单。");

                    console.info("本页订单数据:");
                    console.info(currentPageOrdersData);
                }
            }
        };
        xhttp.open("GET", snapShotUrl);
        xhttp.send();
    }, randomTimeout);
}

//处理订单数据
function processOrderList(order) {
    let orderData = {};
    let textContent = order.textContent;
    let pattern = /(\d{4}-\d{2}-\d{2})订单号: ()/;
    let isExist = pattern.exec(textContent);

    if (!isExist) {
        console.info("暂未发现订单！");
    } else {
        const date = isExist[1];
        const id = order.querySelector("div[data-id]").getAttribute("data-id");

        var index = 0;

        var ShopNameQuery = null;
        var picUrlQuery = null;
        var ProductUrlQuery = null;
        var ProductNameQuery = null;
        var snapshotUrlQuery = null;
        var SKUNameQuery = null;
        var RealPriceQuery = null;
        var countQuery = null;
        var refundQuery = null;
        var actualFeeQuery = null;
        var statusQuery = null;
        var DetailUrlQuery1 = null;
        var DetailUrlQuery2 = null;

        while (true) {
            if (index === 0) {
                ShopNameQuery = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:0.0.1.0.1']");
                actualFeeQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$4.0.0.2.0.1']");
                statusQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$5.0.0.0.0']");
                DetailUrlQuery1 = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$5.0.1.$0.0.0']");
                DetailUrlQuery2 = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$5.0.1.$1.0.0']");
            }

            picUrlQuery = order.querySelector("img[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.0.0.0.0']");
            ProductUrlQuery = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.0.0']");
            ProductNameQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.0.0.1']");
            snapshotUrlQuery = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.0.1']");
            SKUNameQuery = order.querySelector("p[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.1']");
            RealPriceQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$1.0.1.1']");
            countQuery = order.querySelector("p[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$2.0.0']");
            refundQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$3.0.$0.0.0.$text']");

            index++;
            let orderDataIndex = id + index;

            if (ProductNameQuery === null) {
                break;
            }

            //过滤黑名单项：如"保险服务"、"增值服务"、"买家秀"等;
            var isEnableBlackList = document.getElementById("BlackListStatus").checked;
            if (isEnableBlackList === true && ProductNameBlackList.length > 0) {
                var searchResult = null;

                for (let item of ProductNameBlackList) {
                    searchResult = ProductNameQuery.textContent.search(item);
                    if (searchResult > -1) {
                        break;
                    }
                }

                if (searchResult > -1) {
                    continue;
                }
            }

            //修复淘宝订单页面中的字符实体显示错误和英文逗号导致的CSV导入Excel后数据错行；
            ProductNameQuery.innerHTML = ProductNameQuery.innerHTML.replace(/&amp;([a-zA-Z]*)/g, "&$1");
            ProductNameQuery.innerHTML = ProductNameQuery.innerHTML.replace(/,/g, "，");
            if (SKUNameQuery !== null) {
                SKUNameQuery.innerHTML = SKUNameQuery.innerHTML.replace(/&amp;([a-zA-Z]*).*?：/g, "&$1;");
                SKUNameQuery.innerHTML = SKUNameQuery.innerHTML.replace(/,/g, "，");
            }

            var orderInfoId = id;
            var orderInfoDate = date;
            var sellerInfoShopName = ShopNameQuery === null ? "" : ShopNameQuery.innerText;
            var subOrdersIteminfoPicUrl = picUrlQuery === null ? "" : picUrlQuery.src;
            var subOrdersIteminfoProductUrl = ProductUrlQuery === null ? "" : ProductUrlQuery.href;
            var subOrdersIteminfoProductName = ProductNameQuery.textContent;
            var subOrdersIteminfoSnapUrl = snapshotUrlQuery === null ? "" : snapshotUrlQuery.href;
            var subOrdersIteminfoSKUName = SKUNameQuery === null ? "" : SKUNameQuery.innerText;
            var subOrdersPriceinfoRealPrice = RealPriceQuery === null ? "" : RealPriceQuery.textContent;
            var subOrdersQuantityCount = countQuery === null ? "" : countQuery.textContent;
            var subOrdersRefund = refundQuery === null ? "" : refundQuery.innerText === "查看退款" ? "退款" : "";
            var payInfoActualFee = actualFeeQuery === null ? "" : actualFeeQuery.textContent;
            var statusInfoStatus = statusQuery === null ? "" : statusQuery.textContent;
            var statusInfoDetailUrl = DetailUrlQuery1 === null ? (DetailUrlQuery2 === null ? "" : DetailUrlQuery2.href) : DetailUrlQuery1.href;

            var subOrdersSnapshotProductName = null;

            //选择图片尺寸
            if (imageDimensionsList[imageDimensionsIndex] === "800x800") {
                subOrdersIteminfoPicUrl = subOrdersIteminfoPicUrl.replace(/_80x80.(jpg|png)/, "");
            } else {
                subOrdersIteminfoPicUrl = subOrdersIteminfoPicUrl.replace(/\d*x\d*(?=.(jpg|png))/, imageDimensionsList[imageDimensionsIndex]);
            }

            //Excel数据格式适配
            var isEnableDataFormatAdaptation = document.getElementById("DataFormatAdaptationStatus").checked;
            if (isEnableDataFormatAdaptation === true) {
                orderInfoId = '"' + id + '\t"';
            }

            //获取快照商品名称
            var isEnableSnapProductName = document.getElementById("SnapProductNameStatus").checked;
            if (isEnableSnapProductName === true) {
                getSnapShotProductNameCount++;
                getSnapShotProductName(subOrdersIteminfoSnapUrl, orderDataIndex);
            } else {
                subOrdersSnapshotProductName = "";
            }

            //精简数据
            subOrdersIteminfoProductUrl = subOrdersIteminfoProductUrl.replace(/&_u=\w*/, "");
            //subOrdersIteminfoSnapUrl = subOrdersIteminfoSnapUrl.replace(/&snapShot=true/, "");
            subOrdersIteminfoSKUName = subOrdersIteminfoSKUName.replace(/颜色分类：?/, " ");
            statusInfoDetailUrl = statusInfoDetailUrl.replace(/&route_to=tm1/, "");

            //项目标题在序列中的位置自动同步到项目数据在序列中的位置
            var orderDataItemData = [];
            orderDataItemData[orderHeader.indexOf("下单日期")] = orderInfoDate;
            orderDataItemData[orderHeader.indexOf("订单编号")] = orderInfoId;
            orderDataItemData[orderHeader.indexOf("店铺名称")] = sellerInfoShopName;
            orderDataItemData[orderHeader.indexOf("商品名称")] = subOrdersIteminfoProductName;
            orderDataItemData[orderHeader.indexOf("快照商品名称")] = subOrdersSnapshotProductName;
            orderDataItemData[orderHeader.indexOf("商品分类")] = subOrdersIteminfoSKUName;
            orderDataItemData[orderHeader.indexOf("商品主图")] = subOrdersIteminfoPicUrl;
            orderDataItemData[orderHeader.indexOf("商品链接")] = subOrdersIteminfoProductUrl;
            orderDataItemData[orderHeader.indexOf("交易快照")] = subOrdersIteminfoSnapUrl;
            orderDataItemData[orderHeader.indexOf("单价")] = subOrdersPriceinfoRealPrice;
            orderDataItemData[orderHeader.indexOf("数量")] = subOrdersQuantityCount;
            orderDataItemData[orderHeader.indexOf("实付款")] = payInfoActualFee;
            orderDataItemData[orderHeader.indexOf("退款状态")] = subOrdersRefund;
            orderDataItemData[orderHeader.indexOf("交易状态")] = statusInfoStatus;
            orderDataItemData[orderHeader.indexOf("订单详情链接")] = statusInfoDetailUrl;

            orderData[orderDataIndex] = orderDataItemData;
        }
    }
    return orderData;
}
