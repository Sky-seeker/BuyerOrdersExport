// ==UserScript==
// @name         淘宝买家订单数据导出
// @namespace    https://github.com/Sky-seeker/BuyerOrdersExport
// @version      1.3.4
// @description  “淘宝买家订单数据导出”最初基于“淘宝买家订单导出-颜色分类”添加了“商品主图”，修改和修复了一些细节问题，当前版本与之前已经有了较大的变动。导出的项目包括下单日期、订单编号、子订单编号、店铺名称、商品名称、快照商品名称、商品颜色分类、商品主图链接、商品链接、商品交易快照链接、单价、数量、订单实付款、退款状态、订单交易状态、订单详情链接。导出的订单数据为CSV文件。在导出淘宝买家订单数据时，支持一些可选功能，如商品名称和店铺名称黑名单关键字过滤，快照商品名称获取以及获取时的随机延时，Excel 数据格式适配，订单详情链接一致化。支持项目标题次序自定义，支持图片链接尺寸选择，支持项目标题和黑名单列表的数据的本地存储。使用的过程中会有反馈，如按钮的可用状态和颜色变化，以及窗口右下角的气泡通知等。
// @author       梦幻之心星
// @match        https://buyertrade.taobao.com/trade/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.15/lodash.min.js
// @grant        none
// @license      MIT
// @supportURL   https://github.com/Sky-seeker/BuyerOrdersExport
// ==/UserScript==

var orderList = {};
var pageOrderList = {};
var orderHeaderList = [];
var blackList = [];
var imageDimensionsIndex = 0;

const fileNamePrefix = "淘宝买家订单数据导出_";
const fileNameSuffix = "";

const defaultOrderHeaderList = [
    "下单日期",
    "订单编号",
    "子订单编号",
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
const defaultBlackList = ["保险服务", "增值服务", "买家秀"];
const imageDimensionsList = ["80x80", "100x100", "160x160", "200x200", "240x240", "300x300", "320x320", "400x400", "480x480", "560x560", "600x600", "640x640", "720x720", "800x800"];

var httpRequestResult = {
    SnapShotAmount: 0,
    getSnapShotCount: 0,
    iSgetSnapShotFinish: false,

    iSFinish: false,
};
//通知气泡默认属性
function createToast() {
    const Toast = document.createElement("div");
    const ToastText = document.createTextNode("通知气泡");

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
    const Toast = document.getElementById("Toast");

    Toast.style.visibility = "visible";
    Toast.textContent = toastTextContent;

    if (alwaysShow === false) {
        setTimeout(function () {
            Toast.style.visibility = "hidden";
        }, 3000);
    }
}

//文本区域默认属性
function createTextarea(element, onchangeFunc, text, id, width, rows) {
    const Textarea = document.createElement("TEXTAREA");
    const TextareaTitle = document.createElement("p");

    Textarea.id = id;
    Textarea.rows = rows;
    Textarea.cols = 30;
    Textarea.placeholder = "每行一条。";

    Textarea.style.width = width;
    Textarea.style.height = "140px";
    Textarea.style.padding = "5px";

    TextareaTitle.textContent = text;
    TextareaTitle.style.fontSize = "15px";
    TextareaTitle.style.fontWeight = "700";

    Textarea.onchange = function () {
        onchangeFunc();
    };

    element.appendChild(TextareaTitle);
    element.appendChild(Textarea);
}

//单选按钮默认属性
function addRadio(element, onchangeFunc, name, text, id, value) {
    const radio = document.createElement("input");
    const radioText = document.createTextNode(text);

    radio.id = id;
    radio.value = value;
    radio.type = "radio";
    radio.name = name;

    radio.style.verticalAlign = "middle";
    radio.style.marginLeft = "25px";
    radio.style.marginRight = "5px";

    radio.onchange = function () {
        onchangeFunc();
    };

    element.appendChild(radio);
    element.appendChild(radioText);
}

//复选框默认属性
function addCheckbox(element, onchangeFunc, text, id) {
    const checkbox = document.createElement("input");
    const checkboxText = document.createTextNode(text);

    checkbox.id = id;
    checkbox.type = "checkbox";
    checkbox.defaultChecked = true;

    checkbox.style.verticalAlign = "middle";
    checkbox.style.marginLeft = "22px";
    checkbox.style.marginRight = "5px";

    checkbox.onchange = function () {
        onchangeFunc();
    };

    element.appendChild(checkbox);
    element.appendChild(checkboxText);
}

//按钮默认属性
function addButton(element, onclickFunc, text, id, width, marginLeft) {
    const button = document.createElement("input");

    button.id = id;
    button.type = "button";
    button.value = text;
    button.style.height = "50px";
    button.style.width = width;
    button.style.align = "center";
    button.style.marginLeft = marginLeft;
    //button.style.marginBottom = "20px";
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
    const ListTitle = document.createElement("p");
    const ListSelect = document.createElement("select");

    ListTitle.id = "imageDimensionsListTitle";
    ListTitle.textContent = "图片尺寸：";

    ListSelect.id = "imageDimensionsListSelect";
    ListSelect.name = "imageDimensions";

    ListTitle.style.float = "left";
    ListTitle.style.fontSize = "15px";
    ListTitle.style.fontWeight = 700;

    ListSelect.style.width = "85px";
    ListSelect.style.marginLeft = "5px";

    //添加下拉列表项
    for (let imageDimension of imageDimensionsList) {
        const ListSelectOption = document.createElement("option");

        ListSelectOption.text = imageDimension;
        ListSelectOption.value = imageDimension;

        ListSelect.add(ListSelectOption);
    }

    ListSelect.onchange = function () {
        choseImageDimensions();
    };

    element.appendChild(ListTitle);

    //const imageDimensionsList = ["80x80", "100x100", "160x160", "200x200", "240x240","300x300","320x320",
    //    "400x400","480x480", "560x560", "600x600","640x640", "720x720","800x800"];

    //添加单选项：常用值
    addRadio(element, changeImageDimensions, "imageDimensions", "80x80", "80x80", "80x80");
    addRadio(element, changeImageDimensions, "imageDimensions", "300x300", "300x300", "300x300");
    addRadio(element, changeImageDimensions, "imageDimensions", "560x560", "560x560", "560x560");
    addRadio(element, changeImageDimensions, "imageDimensions", "800x800", "800x800", "800x800");
    addRadio(element, changeImageDimensions, "imageDimensions", "其它", "otherImageDimensions", "otherImageDimensions");

    element.appendChild(ListSelect);
}

//在订单列表页面添加控件
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

    createTextarea(userMainTextCol1, changeOrderListHeader, "项目标题", "orderListHeader", "100px", 20);
    createTextarea(userMainTextCol2, changeBlackListKey, "黑名单关键词", "BlackListKey", "120px", 8);

    createImageDimensionsListSelect(userMainListRow0Form);

    addCheckbox(userMainListRow1Form, changeBlackListStatus, "黑名单过滤", "BlackListStatus");
    addCheckbox(userMainListRow1Form, changeDelayStatus, "数据获取延时", "DelayStatus");
    addCheckbox(userMainListRow1Form, changeSnapProductNameStatus, "快照名称获取", "SnapProductNameStatus");
    addCheckbox(userMainListRow1Form, changeDataFormatAdaptationStatus, "Excel 格式适配", "DataFormatAdaptationStatus");
    addCheckbox(userMainListRow1Form, changeUrlUniformizationStatus, "链接一致化", "UrlUniformizationStatus");

    addButton(userMainListRow2, resetBlackList, "重置黑名单列表", "resetBlackList", "130px", "20px");
    addButton(userMainListRow2, resetOrderListHeader, "重置项目标题", "resetOrderListHeader", "130px", "20px");
    addButton(userMainListRow2, readLocalStorageData, "读取本地存储", "readLocalStorageData", "130px", "20px");
    addButton(userMainListRow2, writeLocalStorageData, "写入本地存储", "writeLocalStorageData", "130px", "20px");

    addButton(userMainListRow3, clearOrdersList, "清空订单数据", "clearOrdersList", "170px", "35px");
    addButton(userMainListRow3, exportOrdersList, "导出订单数据", "exportOrdersList", "170px", "35px");
    addButton(userMainListRow3, addPageOrdersToList, "添加本页订单", "addPageOrdersToList", "170px", "35px");

    setOrderListPageElementStyle();

    resetOrderListHeader();
    resetBlackList();

    console.info("在订单列表页面添加控件!");
}

//设置订单列表页面元素样式
function setOrderListPageElementStyle() {
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
    userMainText.style.width = "260px";
    userMainText.style.marginLeft = "0px";
    userMainText.style.display = "inline-block";

    userMainList.style.float = "left";
    userMainList.style.width = "580px";
    userMainList.style.marginLeft = "30px";

    userMainTextCol1.style.float = "left";
    userMainTextCol1.style.width = "110px";
    userMainTextCol1.style.marginLeft = "0px";

    userMainTextCol2.style.float = "left";
    userMainTextCol2.style.width = "130px";
    userMainTextCol2.style.marginLeft = "20px";

    userMainListRow0.style.fontSize = "14px";
    userMainListRow1.style.fontSize = "14px";

    userMainListRow0.style.height = "20px";
    userMainListRow1.style.height = "20px";
    userMainListRow2.style.height = "70px";
    userMainListRow3.style.height = "60px";

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
    document.getElementById("addPageOrdersToList").style.background = "#409EFF";

    document.getElementById("tp-bought-root").removeEventListener("click", ResetButtonStatus);
}

//数据转为csv文本文件
function toCsv(header, data, filename) {
    var rows = "";
    var row = header.join(",");
    rows += row + "\n";

    for (let key in data) {
        rows += data[key].join(",") + "\n";
    }

    var blob = new Blob(["\ufeff" + rows], { type: "text/csv;charset=utf-8;" });
    var encodedUrl = URL.createObjectURL(blob);
    var url = document.createElement("a");
    url.setAttribute("href", encodedUrl);
    url.setAttribute("download", filename + ".csv");
    document.body.appendChild(url);
    url.click();
}

//添加本页订单数据
function addPageOrdersToList() {
    const mainOrders = document.getElementsByClassName("js-order-container");

    document.getElementById("addPageOrdersToList").style.background = "#ff9800";

    pageOrderList = {};

    console.time("processOrderList");
    //遍历每条订单记录
    for (let order of mainOrders) {
        var orderItem = processOrderList(order);

        if (!orderItem) {
            continue;
        }

        for (let orderItemKey in orderItem) {
            orderList[orderItemKey] = orderItem[orderItemKey];
            pageOrderList[orderItemKey] = orderItem[orderItemKey];
        }

        //console.count("order count: ");

        //break; //TODO:测试单条订单记录
    }
    console.timeEnd("processOrderList");

    //通过交易快照获取商品信息
    //open("https://buyertrade.taobao.com/trade/detail/tradeSnap.htm"); //打开交易快照页面
    const isEnableSnapProductName = document.getElementById("SnapProductNameStatus").checked;
    if (isEnableSnapProductName === true) {
        const snapUrlIndex = orderHeaderList.indexOf("交易快照");
        const snapshotProductNameIndex = orderHeaderList.indexOf("快照商品名称");
        var snapUrl = null;

        Toast("正在获取快照商品名称...", true);
        console.info("正在获取快照商品名称...");

        for (let orderItemKey in pageOrderList) {
            snapUrl = pageOrderList[orderItemKey][snapUrlIndex];

            getDataFromSnapShot(orderItemKey, snapshotProductNameIndex, snapUrl);
            //break; //TODO:测试单条快照记录
        }
    }

    if (isEnableSnapProductName === false) {
        document.getElementById("addPageOrdersToList").style.background = "#4CAF50";

        document.getElementById("tp-bought-root").addEventListener("click", ResetButtonStatus);

        Toast("添加 " + Object.keys(pageOrderList).length + " 条订单,已添加 " + Object.keys(orderList).length + " 条订单。");
        console.info("添加 " + Object.keys(pageOrderList).length + " 条订单,已添加 " + Object.keys(orderList).length + " 条订单。");

        console.info("本页订单数据:");
        console.info(pageOrderList);
    }
}

//导出订单数据
function exportOrdersList() {
    if (httpRequestResult.iSgetSnapShotFinish === true) {
        httpRequestResult.iSFinish = true;
    }

    if (httpRequestResult.iSFinish === false) {
        alert("请等待添加成功后再导出！");
        return;
    }

    var dateTimeStr = "";
    var dateTime = new Date(); //获取当前日期

    dateTime.setUTCHours(dateTime.getHours()); //修正本地时与世界时之间的时差

    dateTimeStr = dateTime.toISOString(); //格式为: YYYY-MM-DDTHH:mm:ss.sssZ

    dateTimeStr = dateTimeStr.replace(/T/, "_");
    dateTimeStr = dateTimeStr.replace(/:/g, "-");
    dateTimeStr = dateTimeStr.replace(/\.\d{3}Z$/, "");

    const fileName = fileNamePrefix + dateTimeStr + fileNameSuffix;

    toCsv(orderHeaderList, orderList, fileName);
}

//清空订单数据
function clearOrdersList() {
    const count = Object.keys(orderList).length;
    orderList = {};

    Toast("清空了: " + count + " 条订单数据!");
    console.info("清空了: " + count + " 条订单数据!");
}

//写入本地存储: 项目标题 + 黑名单列表
function writeLocalStorageData() {
    var orderHeaderListString = "";
    var blackListString = "";

    if (typeof Storage !== "undefined") {
        //localStorage.clear();

        orderHeaderListString = orderHeaderList.join("\n");
        blackListString = blackList.join("\n");

        localStorage.setItem("orderHeaderList", orderHeaderListString);
        localStorage.setItem("blackList", blackListString);

        Toast("存储数据到本地！");
        console.info("存储数据到本地！");
        console.info("orderHeaderList" + "[" + orderHeaderList.length + "]:" + orderHeaderList);
        console.info("blackList" + "[" + blackList.length + "]:" + blackList);
        console.info("localStorage" + "[" + localStorage.length + "]:");
        console.info(localStorage);
    } else {
        Toast("你的浏览器不支持网页存储！");
        console.info("你的浏览器不支持网页存储！");
        alert("你的浏览器不支持网页存储！");
    }
}

//读取本地存储: 项目标题 + 黑名单列表
function readLocalStorageData() {
    if (typeof Storage !== "undefined") {
        var orderHeaderDatalength = 0;
        var blackListDatalength = 0;
        var orderHeaderListString = "";
        var blackListString = "";

        orderHeaderListString = localStorage.getItem("orderHeaderList");
        blackListString = localStorage.getItem("blackList");

        if (orderHeaderListString !== null) {
            orderHeaderList = orderHeaderListString.split("\n");
            document.getElementById("orderListHeader").value = orderHeaderList.join("\n") + "\n";
        } else {
            Toast("本地存储的项目标题为空！");
            console.info("本地存储的项目标题为空！");
            alert("本地存储的项目标题为空！");
        }

        if (blackListString !== null) {
            blackList = blackListString.split("\n");
            document.getElementById("BlackListKey").value = blackList.join("\n") + "\n";
        } else {
            Toast("本地存储的黑名单列表为空！");
            console.info("本地存储的黑名单列表为空！");
            alert("本地存储的黑名单列表为空！");
        }

        if (orderHeaderListString !== null || blackListString !== null) {
            Toast("读取数据到脚本！");
            console.info("读取数据到脚本！");
            console.info("orderHeaderList" + "[" + orderHeaderList.length + "]:" + orderHeaderList);
            console.info("blackList" + "[" + blackList.length + "]:" + blackList);
            console.info("localStorage" + "[" + localStorage.length + "]:");
            console.info(localStorage);
        }
    } else {
        Toast("你的浏览器不支持网页存储！");
        console.info("你的浏览器不支持网页存储！");
        alert("你的浏览器不支持网页存储！");
    }
}

//改变项目标题
function changeOrderListHeader() {
    const textareaContent = document.getElementById("orderListHeader").value;

    if (textareaContent.search(/\S+/) === -1) {
        textareaContent = orderHeaderList.join("\n") + "\n";

        document.getElementById("orderListHeader").value = textareaContent;

        Toast("项目标题不能为空!");
        console.info("项目标题不能为空!");
        alert("项目标题不能为空！");
    } else {
        orderHeaderList = textareaContent.match(/\S+/g);
        textareaContent = orderHeaderList.join("\n") + "\n";

        document.getElementById("orderListHeader").value = textareaContent;

        Toast("设置项目标题!");
        console.info("设置项目标题!");
        console.info("orderHeaderList[" + orderHeaderList.length + "]:" + orderHeaderList);
    }
}

//重置项目标题
function resetOrderListHeader() {
    var textareaContent = "";

    orderHeaderList = defaultOrderHeaderList;
    textareaContent = orderHeaderList.join("\n") + "\n";

    document.getElementById("orderListHeader").value = textareaContent;

    Toast("重置项目标题!");
    console.info("重置项目标题!");
    console.info("orderHeaderList[" + orderHeaderList.length + "]:" + orderHeaderList);
}

//改变黑名单列表
function changeBlackListKey() {
    const textareaContent = document.getElementById("BlackListKey").value;

    if (textareaContent.search(/\S+/) === -1) {
        document.getElementById("BlackListKey").value = "";
        blackList = [];

        Toast("清空黑名单列表!");
        console.info("清空黑名单列表!");
        console.info("blackList:" + blackList);
    } else {
        blackList = textareaContent.match(/\S+/g);
        textareaContent = blackList.join("\n") + "\n";

        document.getElementById("BlackListKey").value = textareaContent;

        Toast("设置黑名单列表!");
        console.info("设置黑名单列表!");
        console.info("blackList[" + blackList.length + "]:" + blackList);
    }
}

//重置黑名单列表
function resetBlackList() {
    var textareaContent = "";

    blackList = defaultBlackList;
    textareaContent = blackList.join("\n") + "\n";

    document.getElementById("BlackListKey").value = textareaContent;

    Toast("重置黑名单列表!");
    console.info("重置黑名单列表!");
    console.info("blackList[" + blackList.length + "]:" + blackList);
}

//启用/禁用 商品名黑名单过滤
function changeBlackListStatus() {
    const isEnableBlackListStatus = document.getElementById("BlackListStatus").checked;

    if (isEnableBlackListStatus === true) {
        document.getElementById("resetBlackList").disabled = false;
        document.getElementById("resetBlackList").style.opacity = 1;

        Toast("启用商品名黑名单过滤!");
        console.info("启用商品名黑名单过滤!");
    } else {
        document.getElementById("resetBlackList").disabled = true;
        document.getElementById("resetBlackList").style.opacity = 0.6;

        Toast("禁用商品名黑名单过滤!");
        console.info("禁用商品名黑名单过滤!");
    }
}

//启用/禁用 快照获取随机延时
function changeDelayStatus() {
    const isEnableDelayStatus = document.getElementById("DelayStatus").checked;

    if (isEnableDelayStatus === true) {
        Toast("启用快照获取随机延时!");
        console.info("启用快照获取随机延时!");
    } else {
        Toast("禁用快照获取随机延时!");
        console.info("禁用快照获取随机延时!");
    }
}

//启用/禁用 快照商品名称获取
function changeSnapProductNameStatus() {
    const isEnableSnapProductNameStatus = document.getElementById("SnapProductNameStatus").checked;

    if (isEnableSnapProductNameStatus === true) {
        Toast("启用快照商品名称获取!");
        console.info("启用快照商品名称获取!");
    } else {
        Toast("禁用快照商品名称获取!");
        console.info("禁用快照商品名称获取!");
    }
}

//启用/禁用 Excel数据格式适配
function changeDataFormatAdaptationStatus() {
    const isEnableDataFormatAdaptationStatus = document.getElementById("DataFormatAdaptationStatus").checked;

    if (isEnableDataFormatAdaptationStatus === true) {
        Toast("启用Excel数据格式适配!");
        console.info("启用Excel数据格式适配!");
    } else {
        Toast("禁用Excel数据格式适配!");
        console.info("禁用Excel数据格式适配!");
    }
}

//启用/禁用 订单详情链接一致化
function changeUrlUniformizationStatus() {
    const isEnableUrlUniformizationStatus = document.getElementById("UrlUniformizationStatus").checked;

    if (isEnableUrlUniformizationStatus === true) {
        Toast("启用订单详情链接一致化!");
        console.info("启用订单详情链接一致化!");
    } else {
        Toast("禁用订单详情链接一致化!");
        console.info("禁用订单详情链接一致化!");
    }
}

// 改变图片尺寸大小
function changeImageDimensions() {
    const radios = document.getElementsByName("imageDimensions");
    const ListSelect = document.getElementById("imageDimensionsListSelect");
    var imageDimensionsTemp = null;

    for (let radio of radios) {
        if (radio.checked === true) {
            imageDimensionsTemp = radio;
            break;
        }
    }

    if (imageDimensionsTemp.value !== "otherImageDimensions") {
        const imageDimensionsIndexTemp = imageDimensionsList.indexOf(imageDimensionsTemp.value);

        if (imageDimensionsIndexTemp !== -1) {
            imageDimensionsIndex = imageDimensionsIndexTemp;
        }
    } else {
        imageDimensionsIndex = ListSelect.selectedIndex;
    }

    console.log("radios index: " + Array.from(radios).indexOf(imageDimensionsTemp) + ";    radios value: " + imageDimensionsTemp.value);
    console.log("Selected Value: " + ListSelect.value + ";    Selected Text: " + ListSelect.options[ListSelect.selectedIndex].text);
    console.log("imageDimensions index: " + imageDimensionsIndex + "    image dimensions: " + imageDimensionsList[imageDimensionsIndex]);
}

// 监听下拉列表的变化，改变图片尺寸大小
function choseImageDimensions() {
    const ListSelect = document.getElementById("imageDimensionsListSelect");

    if (document.getElementById("otherImageDimensions").checked === true) {
        imageDimensionsIndex = ListSelect.selectedIndex;
    }

    var selectedValue = ListSelect.value; // 获取选中的值
    var selectedText = ListSelect.options[ListSelect.selectedIndex].text; // 获取选中的文本

    console.log("Selected Value: " + selectedValue + ";    Selected Text: " + selectedText);
    console.log("imageDimensions index: " + imageDimensionsIndex + "    image dimensions: " + imageDimensionsList[imageDimensionsIndex]);
}

//获取交易快照数据
function getDataFromSnapShot(orderItemIndex, orderItemDataIndex, Url) {
    const isenableDelay = document.getElementById("DelayStatus").checked;
    var randomTimeout = 0;

    if (Url === "") {
        console.info("订单号[" + orderItemIndex + "]快照链接为空！");
        return;
    }

    if (httpRequestResult.getSnapShotCount === 0) {
        console.time("getDataFromSnapShot");
    }

    httpRequestResult.getSnapShotCount++;
    httpRequestResult.SnapShotAmount = httpRequestResult.getSnapShotCount;

    if (isenableDelay === true) {
        const min = 500; //毫秒
        const max = 2000; //毫秒
        randomTimeout = Math.round(Math.random() * (max - min)) + min;
    }

    setTimeout(function () {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ShotProductName = "";
                var ResponseJSONData = "";
                var getWayid = 1;

                httpRequestResult.getSnapShotCount--;

                //console.info("交易快照网页响应文本:" + this.responseText);

                if ((getWayid = 1)) {
                    //在交易快照页面通过正则表达式获取HTML数据后获取标题
                    //<title>原装正品 0805贴片电阻 10&amp;Omega; 10欧 1/8W 精度&amp;plusmn;1% （50只）</title>
                    ShotProductName = this.responseText.match(/<title>(.*)<\/title>/)[1];

                    //修复商品快照页面中的字符实体显示错误和英文逗号导致的CSV导入Excel后数据错行；
                    const element = document.createElement("span");
                    element.innerHTML = ShotProductName;
                    element.innerHTML = element.innerHTML.replace(/&amp;([a-zA-Z]*)/g, "&$1");
                    element.innerHTML = element.innerHTML.replace(/,/g, "，");
                    ShotProductName = element.innerText;
                    element.remove();

                    console.info("快照网页响应文本 HTML数据 标题部分:" + ShotProductName);
                }

                if ((getWayid = 2)) {
                    //在交易快照页面通过正则表达式获取JSON数据后获取标题
                    //var data = JSON.parse('{......}');
                    ResponseJSONData = this.responseText.match(/data = JSON\.parse\('(.*)'\)\;/);
                    if (ResponseJSONData !== null) {
                        ResponseJSONData = ResponseJSONData[1];
                        ResponseJSONData = ResponseJSONData.replace(/\\u/g, "%u");
                        ResponseJSONData = unescape(ResponseJSONData);
                        ResponseJSONData = ResponseJSONData.replace(/\\\"/g, '"');
                        ResponseJSONData = ResponseJSONData.replace(/\\\//g, "/");
                        var data = JSON.parse(ResponseJSONData);
                        ShotProductName = data["baseSnapDO"]["itemSnapDO"]["title"];

                        console.info("快照网页响应文本 JSON数据 标题部分:" + ShotProductName);
                    }
                }

                pageOrderList[orderItemIndex][orderItemDataIndex] = ShotProductName;
                orderList[orderItemIndex][orderItemDataIndex] = ShotProductName;

                console.info("快照商品名称[" + orderItemIndex + "]:" + ShotProductName);

                if (httpRequestResult.getSnapShotCount === 0) {
                    httpRequestResult.iSgetSnapShotFinish = true;

                    console.timeEnd("getDataFromSnapShot");

                    document.getElementById("addPageOrdersToList").style.background = "#4CAF50";
                    document.getElementById("tp-bought-root").addEventListener("click", ResetButtonStatus);

                    Toast("添加 " + Object.keys(pageOrderList).length + " 条订单,添加 " + httpRequestResult.SnapShotAmount + " 条快照,已添加 " + Object.keys(orderList).length + " 条订单。");
                    console.info("添加 " + Object.keys(pageOrderList).length + " 条订单,添加 " + httpRequestResult.SnapShotAmount + " 条快照,已添加 " + Object.keys(orderList).length + " 条订单。");

                    httpRequestResult.SnapShotAmount = 0;

                    console.info("本页订单数据:");
                    console.info(pageOrderList);
                }
            }
        };
        xhttp.open("GET", Url);
        xhttp.send();
    }, randomTimeout);
}

//处理订单数据
function processOrderList(order) {
    var orderData = {};
    var textContent = order.textContent;
    var pattern = /(\d{4}-\d{2}-\d{2})订单号: ()/;
    var isExist = pattern.exec(textContent);

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
            var orderItemIndex = id + index;

            if (ProductNameQuery === null) {
                break;
            }

            //过滤黑名单项：如"保险服务"、"增值服务"、"买家秀"等;
            const isEnableBlackList = document.getElementById("BlackListStatus").checked;
            if (isEnableBlackList === true && blackList.length > 0) {
                var searchResult = false;

                for (let item of blackList) {
                    if (ProductNameQuery.textContent.search(item) !== -1) {
                        searchResult = true;
                        break;
                    }

                    if (ShopNameQuery.innerText.search(item) !== -1) {
                        searchResult = true;
                        break;
                    }
                }

                if (searchResult === true) {
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
            var subOrdersIteminfoId = orderItemIndex;
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
            const isEnableDataFormatAdaptation = document.getElementById("DataFormatAdaptationStatus").checked;
            if (isEnableDataFormatAdaptation === true) {
                orderInfoId = '"' + orderInfoId + '\t"';
                subOrdersIteminfoId = '"' + subOrdersIteminfoId + '\t"';
            }

            //订单详情链接一致化
            const isEnableUrlUniformization = document.getElementById("UrlUniformizationStatus").checked;
            if (isEnableUrlUniformization === true) {
                //过去的淘宝和天猫订单详情链接为：https://tradearchive.taobao.com/trade/detail/trade_item_detail.htm?bizOrderId=<id>
                const recentTaoBaoOrderDetailUrlPrefix = "buyertrade.taobao.com/trade/detail/trade_item_detail"; //最近的淘宝订单详情链接前缀
                const recentTmallOrderDetailUrlPrefix = "trade.tmall.com/detail/orderDetail"; //最近的天猫订单详情链接前缀
                const passedOrderDetailUrlPrefix = "tradearchive.taobao.com/trade/detail/trade_item_detail"; //过去的淘宝和天猫订单详情链接前缀

                statusInfoDetailUrl = statusInfoDetailUrl.replace(recentTaoBaoOrderDetailUrlPrefix, passedOrderDetailUrlPrefix);
                statusInfoDetailUrl = statusInfoDetailUrl.replace(recentTmallOrderDetailUrlPrefix, passedOrderDetailUrlPrefix);
            }

            //精简数据
            subOrdersIteminfoProductUrl = subOrdersIteminfoProductUrl.replace(/&_u=\w*/, "");
            //subOrdersIteminfoSnapUrl = subOrdersIteminfoSnapUrl.replace(/&snapShot=true/, "");
            subOrdersIteminfoSKUName = subOrdersIteminfoSKUName.replace(/颜色分类：?/, " ");
            statusInfoDetailUrl = statusInfoDetailUrl.replace(/&route_to=tm1/, "");

            //项目标题在序列中的位置自动同步到项目数据在序列中的位置
            var orderDataItemData = [];
            orderDataItemData[orderHeaderList.indexOf("下单日期")] = orderInfoDate;
            orderDataItemData[orderHeaderList.indexOf("订单编号")] = orderInfoId;
            orderDataItemData[orderHeaderList.indexOf("子订单编号")] = subOrdersIteminfoId;
            orderDataItemData[orderHeaderList.indexOf("店铺名称")] = sellerInfoShopName;
            orderDataItemData[orderHeaderList.indexOf("商品名称")] = subOrdersIteminfoProductName;
            orderDataItemData[orderHeaderList.indexOf("快照商品名称")] = subOrdersSnapshotProductName;
            orderDataItemData[orderHeaderList.indexOf("商品分类")] = subOrdersIteminfoSKUName;
            orderDataItemData[orderHeaderList.indexOf("商品主图")] = subOrdersIteminfoPicUrl;
            orderDataItemData[orderHeaderList.indexOf("商品链接")] = subOrdersIteminfoProductUrl;
            orderDataItemData[orderHeaderList.indexOf("交易快照")] = subOrdersIteminfoSnapUrl;
            orderDataItemData[orderHeaderList.indexOf("单价")] = subOrdersPriceinfoRealPrice;
            orderDataItemData[orderHeaderList.indexOf("数量")] = subOrdersQuantityCount;
            orderDataItemData[orderHeaderList.indexOf("实付款")] = payInfoActualFee;
            orderDataItemData[orderHeaderList.indexOf("退款状态")] = subOrdersRefund;
            orderDataItemData[orderHeaderList.indexOf("交易状态")] = statusInfoStatus;
            orderDataItemData[orderHeaderList.indexOf("订单详情链接")] = statusInfoDetailUrl;

            orderData[orderItemIndex] = orderDataItemData;
        }
    }
    return orderData;
}
