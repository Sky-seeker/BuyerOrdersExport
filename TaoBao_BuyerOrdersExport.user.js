// ==UserScript==
// @name         淘宝买家订单数据导出
// @namespace    https://github.com/Sky-seeker/BuyerOrdersExport
// @version      2.0.1
// @description  “淘宝买家订单数据导出”最初基于“淘宝买家订单导出-颜色分类”添加了“商品主图”，修改和修复了一些细节问题，当前版本与之前已经有了较大的变动。导出的项目包括下单日期、订单编号、子订单编号、店铺名称、商品名称、快照商品名称、商品颜色分类名称、商品主图链接、商品链接、商品交易快照链接、单价、数量、商品退款状态、订单实付款、订单交易状态、订单详情链接。并支持添加额外的下单日期时间、快递物流公司、快递物流单号信息。导出的订单数据为CSV文件。在导出淘宝买家订单数据时，支持一些可选功能，如商品名称和店铺名称黑名单关键词过滤，快照商品名称获取以及获取时的随机延时，Excel 数据格式适配，订单详情链接一致化。支持项目标题次序自定义，支持图片链接尺寸选择，支持项目标题和黑名单列表的数据的本地存储。使用的过程中会有反馈，如按钮的可用状态和颜色变化，以及窗口右下角的气泡通知等。
// @author       梦幻之心星
// @match        https://buyertrade.taobao.com/trade/*
// @connect      taobao.com
// @connect      tmall.com
// @grant        GM_xmlhttpRequest
// @license      MIT
// @supportURL   https://github.com/Sky-seeker/BuyerOrdersExport
// ==/UserScript==

var orderList = {};
var orderDetail = {};
var pageOrderList = {};
var orderHeaderList = [];
var blackList = [];
var imageDimensionsIndex = 0;
var ToastTimeout = null;

const fileNamePrefix = "淘宝买家订单数据导出_";
const fileNameSuffix = "";

const defaultOrderHeaderList = [
    "下单日期",
    "订单编号",
    "子订单编号",
    "店铺名称",
    "商品名称",
    "快照名称",
    "分类名称",
    "主图链接",
    "商品链接",
    "快照链接",
    "单价",
    "数量",
    "商品退款状态",
    "订单实付款",
    "订单交易状态",
    "订单详情链接",
];

const defaultBlackList = ["保险服务", "增值服务", "买家秀"];
const imageDimensionsList = ["80x80", "100x100", "160x160", "200x200", "240x240", "300x300", "320x320", "400x400", "480x480", "560x560", "600x600", "640x640", "720x720", "800x800"];

var httpGetResult = {
    snapShotCount: 0,
    snapShotTotal: 0,
    isSnapShotFinish: true,
    orderDetailCount: 0,
    orderDetailTotal: 0,
    isOrderDetailFinish: true,
    isFinish: true,
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
        ToastTimeout = setTimeout(function () {
            Toast.style.visibility = "hidden";
        }, 3000);
    } else {
        clearTimeout(ToastTimeout);
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
function createListSelect(element, name) {
    const ListTitle = document.createElement("p");
    const ListSelect = document.createElement("select");

    ListTitle.id = name + "ListTitle";
    ListTitle.textContent = "图片尺寸：";

    ListSelect.id = name + "ListSelect";
    ListSelect.name = name;

    ListTitle.style.float = "left";
    ListTitle.style.fontSize = "15px";
    ListTitle.style.fontWeight = "700";

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

    //添加单选项：常用值
    addRadio(element, changeImageDimensions, name, "80x80", "80x80", "80x80");
    addRadio(element, changeImageDimensions, name, "300x300", "300x300", "300x300");
    addRadio(element, changeImageDimensions, name, "560x560", "560x560", "560x560");
    addRadio(element, changeImageDimensions, name, "800x800", "800x800", "800x800");
    addRadio(element, changeImageDimensions, name, "其它", "otherImageDimensions", "otherImageDimensions");

    element.appendChild(ListSelect);
}

//在订单列表页面添加控件
const orderListPage = /https?:\/\/buyertrade\.taobao.*?\/trade/g;
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

    createTextarea(userMainTextCol1, changeOrderHeaderList, "订单项目标题", "orderHeaderList", "100px", 20);
    createTextarea(userMainTextCol2, changeBlackListKey, "黑名单关键词", "BlackListKey", "120px", 8);

    createListSelect(userMainListRow0Form, "imageDimensions");

    addCheckbox(userMainListRow1Form, changeBlackListStatus, "黑名单过滤", "BlackListStatus");
    addCheckbox(userMainListRow1Form, changeDelayStatus, "数据获取延时", "DelayStatus");
    addCheckbox(userMainListRow1Form, changeSnapProductNameStatus, "快照名称获取", "SnapProductNameStatus");
    addCheckbox(userMainListRow1Form, changeDataFormatAdaptationStatus, "Excel 格式适配", "DataFormatAdaptationStatus");
    addCheckbox(userMainListRow1Form, changeUrlUniformizationStatus, "链接一致化", "UrlUniformizationStatus");

    addButton(userMainListRow2, resetOrderHeader, "重置项目标题", "resetOrderHeader", "130px", "20px");
    addButton(userMainListRow2, resetBlackList, "重置黑名单列表", "resetBlackList", "130px", "20px");
    addButton(userMainListRow2, readLocalStorageData, "读取本地存储", "readLocalStorageData", "130px", "20px");
    addButton(userMainListRow2, writeLocalStorageData, "写入本地存储", "writeLocalStorageData", "130px", "20px");

    addButton(userMainListRow3, clearOrdersData, "清空订单数据", "clearOrdersData", "130px", "20px");
    addButton(userMainListRow3, exportOrdersData, "导出订单数据", "exportOrdersData", "130px", "20px");
    addButton(userMainListRow3, addOrdersToDetail, "添加订单详情", "addOrdersToDetail", "130px", "20px");
    addButton(userMainListRow3, addPageOrdersToList, "添加本页订单", "addPageOrdersToList", "130px", "20px");

    setOrderListPageElementStyle();

    resetOrderHeader();
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
    document.getElementById("addOrdersToDetail").style.background = "#409EFF";

    document.getElementById("tp-bought-root").removeEventListener("click", ResetButtonStatus);
}

//添加本页订单数据
function addPageOrdersToList() {
    const mainOrders = document.getElementsByClassName("js-order-container");

    document.getElementById("addPageOrdersToList").style.background = "#ff9800";

    pageOrderList = {};

    Toast("正在获取订单列表数据...", true);
    console.info("开始获取订单列表数据...");
    console.time("processOrderList");
    //遍历每条订单记录
    for (let orders of mainOrders) {
        var ordersData = processOrderList(orders);

        if (!ordersData) {
            continue;
        }

        for (let orderItemIndex in ordersData) {
            orderList[orderItemIndex] = ordersData[orderItemIndex];
            pageOrderList[orderItemIndex] = ordersData[orderItemIndex];
        }

        //console.count("order count: ");

        //break; //订单列表数据-单条订单测试
    }
    console.timeEnd("processOrderList");
    console.info("获取订单列表数据结束！");

    //通过交易快照获取商品信息
    const isEnableSnapProductName = document.getElementById("SnapProductNameStatus").checked;
    var isAllEmptySnapUrl = false;
    if (isEnableSnapProductName === true) {
        Toast("正在获取快照商品名称...", true);
        console.info("开始获取快照商品名称...");

        var emptySnapUrlCount = 0;
        const pageOrderListlength = Object.keys(pageOrderList).length;

        httpGetResult.isSnapShotFinish = false;

        for (let orderItemIndex in pageOrderList) {
            var snapUrl = pageOrderList[orderItemIndex]["snapURL"];

            if (snapUrl !== "") {
                getDataFromSnapShot(orderItemIndex, "snapName", snapUrl);
                //break; //订单快照数据-单条快照测试
            } else {
                console.info("子订单号[" + orderItemIndex + "]快照链接为空！");

                emptySnapUrlCount++;
                if (emptySnapUrlCount === pageOrderListlength) {
                    isAllEmptySnapUrl = true;

                    console.info("当页订单列表的快照链接全为空！");
                    console.info("获取订单快照数据结束！");
                }

                continue;
            }
        }
    }

    if (isEnableSnapProductName === false || isAllEmptySnapUrl === true) {
        document.getElementById("addPageOrdersToList").style.background = "#4CAF50";
        document.getElementById("tp-bought-root").addEventListener("click", ResetButtonStatus);

        Toast("添加 " + Object.keys(pageOrderList).length + " 条子订单,已添加 " + Object.keys(orderList).length + " 条子订单。");
        console.info("添加 " + Object.keys(pageOrderList).length + " 条子订单,已添加 " + Object.keys(orderList).length + " 条子订单。");

        console.info("本页订单数据:");
        console.info(pageOrderList);
    }
}

//导出订单数据
function exportOrdersData() {
    if (httpGetResult.isSnapShotFinish === false) {
        httpGetResult.isFinish = false;
    } else if (httpGetResult.isOrderDetailFinish === false) {
        httpGetResult.isFinish = false;
    } else {
        if (Object.keys(orderList).length === 0) {
            httpGetResult.isFinish = false;
        } else {
            httpGetResult.isFinish = true;
        }
    }

    if (httpGetResult.isFinish === false) {
        alert("请等待添加成功后再导出！");
        return;
    }

    console.info("开始对订单列表数据进行可选功能处理和重定位!");
    var orderListTemp = postprocessOrderList(orderList);

    var dateTimeStr = "";
    var dateTime = new Date(); //获取当前日期

    dateTime.setUTCHours(dateTime.getHours()); //修正本地时与世界时之间的时差

    dateTimeStr = dateTime.toISOString(); //格式为: YYYY-MM-DDTHH:mm:ss.sssZ

    dateTimeStr = dateTimeStr.replace(/T/, "_");
    dateTimeStr = dateTimeStr.replace(/:/g, "-");
    dateTimeStr = dateTimeStr.replace(/\.\d{3}Z$/, "");

    const fileName = fileNamePrefix + dateTimeStr + fileNameSuffix;

    dataToCsv(orderHeaderList, orderListTemp, fileName);
}

//清空订单数据
function clearOrdersData() {
    const count = Object.keys(orderList).length;
    orderList = {};

    Toast("清空了: " + count + " 条子订单数据!");
    console.info("清空了: " + count + " 条子订单数据!");
}

//添加订单详情
function addOrdersToDetail() {
    var orderListTemp = {};
    orderDetail = {};

    if (Object.keys(orderList).length === 0) {
        alert("请先添加订单列表数据！");
        return;
    }

    document.getElementById("addOrdersToDetail").style.background = "#ff9800";

    httpGetResult.isOrderDetailFinish = false;

    console.info("开始对订单列表数据进行分类和去重");
    orderListTemp = preprocessOrderList(orderList);

    Toast("正在获取订单详情数据...", true);
    console.info("开始获取订单详情数据...");

    //orderList: ["taoBaoOrderList"];["tmallOrderList"];["archiveOrderList"];
    for (let orderClassIndex in orderListTemp) {
        if (orderClassIndex === "archiveOrderList") {
            console.info("跳过存档的订单详情数据");
            continue;
        }

        console.info("开始获取 " + orderClassIndex.replace("OrderList", "") + " 订单详情数据...");

        for (let orderItemIndex in orderListTemp[orderClassIndex]) {
            var orderDetailURL = orderListTemp[orderClassIndex][orderItemIndex]["DetailURL"];
            getDataFromOrderDetail(orderItemIndex, orderDetailURL);
            //break; //订单详情数据获取-单条测试
        }
    }
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
        var orderHeaderListString = "";
        var blackListString = "";

        orderHeaderListString = localStorage.getItem("orderHeaderList");
        blackListString = localStorage.getItem("blackList");

        if (orderHeaderListString !== null) {
            orderHeaderList = orderHeaderListString.split("\n");
            document.getElementById("orderHeaderList").value = orderHeaderList.join("\n") + "\n";
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
function changeOrderHeaderList() {
    var textareaContent = document.getElementById("orderHeaderList").value;

    if (textareaContent.search(/\S+/) === -1) {
        textareaContent = orderHeaderList.join("\n") + "\n";

        document.getElementById("orderHeaderList").value = textareaContent;

        Toast("项目标题不能为空!");
        console.info("项目标题不能为空!");
        alert("项目标题不能为空！");
    } else {
        orderHeaderList = textareaContent.match(/\S+/g);
        textareaContent = orderHeaderList.join("\n") + "\n";

        document.getElementById("orderHeaderList").value = textareaContent;

        Toast("设置项目标题!");
        console.info("设置项目标题!");
        console.info("orderHeaderList[" + orderHeaderList.length + "]:" + orderHeaderList);
    }
}

//重置项目标题
function resetOrderHeader() {
    var textareaContent = "";

    orderHeaderList = defaultOrderHeaderList;
    textareaContent = orderHeaderList.join("\n") + "\n";

    document.getElementById("orderHeaderList").value = textareaContent;

    Toast("重置项目标题!");
    console.info("重置项目标题!");
    console.info("orderHeaderList[" + orderHeaderList.length + "]:" + orderHeaderList);
}

//改变黑名单列表
function changeBlackListKey() {
    var textareaContent = document.getElementById("BlackListKey").value;

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

//数据转为csv文本文件
function dataToCsv(header, data, filename) {
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

//获取交易快照数据
function getDataFromSnapShot(orderItemIndex, orderItemDataIndex, snapUrl) {
    const isenableDelay = document.getElementById("DelayStatus").checked;
    var randomTimeout = 0;

    if (httpGetResult.snapShotCount === 0) {
        httpGetResult.snapShotTotal = 0;
        console.time("getDataFromSnapShot");
    }

    httpGetResult.snapShotCount++;
    httpGetResult.snapShotTotal = httpGetResult.snapShotCount;

    if (isenableDelay === true) {
        const min = 1000; //毫秒
        const max = 3000; //毫秒
        randomTimeout = Math.round(Math.random() * (max - min)) + min;
    }

    setTimeout(function () {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var ShotProductName = null;
                var JSONString = null;
                var JSONData = {};

                httpGetResult.snapShotCount--;

                //console.info("交易快照网页链接:" + snapUrl);

                var responseString = this.responseText;
                //console.info("交易快照网页响应文本:" + responseString);

                if (ShotProductName === null) {
                    //在交易快照页面通过正则表达式获取HTML数据后获取标题
                    //<title>原装正品 0805贴片电阻 10&amp;Omega; 10欧 1/8W 精度&amp;plusmn;1% （50只）</title>
                    ShotProductName = responseString.match(/<title>(.*)<\/title>/);
                    //console.info("快照网页响应文本 HTML数据 匹配部分:" + ShotProductName);

                    if (ShotProductName !== null) {
                        ShotProductName = ShotProductName[1];

                        //修复商品快照页面中的字符实体显示错误和英文逗号导致的CSV导入Excel后数据错行；
                        const element = document.createElement("span");
                        element.innerHTML = ShotProductName;
                        element.innerHTML = element.innerHTML.replace(/&amp;([a-zA-Z]*)/g, "&$1");
                        element.innerHTML = element.innerHTML.replace(/,/g, "，");
                        ShotProductName = element.innerText;
                        element.remove();

                        //console.info("快照网页响应文本 HTML数据 标题部分:" + ShotProductName);
                    }
                }

                if (ShotProductName === null) {
                    //在交易快照页面通过正则表达式获取JSON数据后获取标题
                    //var data = JSON.parse('{......}');
                    JSONString = responseString.match(/data = JSON\.parse\('(.*)'\);/);
                    //console.info("快照网页响应文本 JSON数据 匹配部分:" + JSONString);

                    if (JSONString !== null) {
                        JSONString = JSONString[1];

                        JSONString = JSONString.replace(/\\u/g, "%u");
                        JSONString = JSONString.replace(/\\(.)/g, "$1");
                        JSONString = unescape(JSONString);

                        JSONData = JSON.parse(JSONString);
                        ShotProductName = JSONData["baseSnapDO"]["itemSnapDO"]["title"];

                        //console.info("快照网页响应文本 JSON数据 标题部分:" + ShotProductName);
                    }
                }

                //console.info("快照商品名称[" + orderItemIndex + "]:" + ShotProductName);
                console.info("正在获取快照商品名称...");

                pageOrderList[orderItemIndex][orderItemDataIndex] = ShotProductName;
                orderList[orderItemIndex][orderItemDataIndex] = ShotProductName;

                if (httpGetResult.snapShotCount === 0) {
                    httpGetResult.isSnapShotFinish = true;

                    console.timeEnd("getDataFromSnapShot");
                    console.info("获取订单快照数据结束！");

                    document.getElementById("addPageOrdersToList").style.background = "#4CAF50";
                    document.getElementById("tp-bought-root").addEventListener("click", ResetButtonStatus);

                    Toast("添加 " + Object.keys(pageOrderList).length + " 条子订单,添加 " + httpGetResult.snapShotTotal + " 条快照,已添加 " + Object.keys(orderList).length + " 条子订单。");
                    console.info("添加 " + Object.keys(pageOrderList).length + " 条子订单,添加 " + httpGetResult.snapShotTotal + " 条快照,已添加 " + Object.keys(orderList).length + " 条子订单。");

                    console.info("本页订单数据:");
                    console.info(pageOrderList);
                }
            }
        };
        xhttp.open("GET", snapUrl);
        xhttp.send();
    }, randomTimeout);
}

//:获取订单详情数据
function getDataFromOrderDetail(orderItemIndex, orderDetailURL) {
    const isenableDelay = document.getElementById("DelayStatus").checked;
    var randomTimeout = 0;

    if (httpGetResult.orderDetailCount === 0) {
        httpGetResult.orderDetailTotal = 0;
        console.time("getDataFromOrderDetail");
    }

    httpGetResult.orderDetailCount++;
    httpGetResult.orderDetailTotal = httpGetResult.orderDetailCount;

    if (isenableDelay === true) {
        const min = 1000; //毫秒
        const max = 3000; //毫秒
        randomTimeout = Math.round(Math.random() * (max - min)) + min;
    }

    //console.info("开始获取订单详情数据...");
    //console.info("订单详情链接为[" + orderItemIndex + "]:" + orderDetailURL);
    setTimeout(function () {
        GM_xmlhttpRequest({
            method: "GET",
            url: orderDetailURL,
            onload: function (response) {
                httpGetResult.orderDetailCount--;

                var responseString = response.responseText;
                //console.info("订单详情网页响应文本:" + responseString);

                //在订单详情页面通过正则表达式获取JSON数据
                var taoBaoOrderDetailDataString = responseString.match(/data = JSON\.parse\('(.*)'\);/);
                var tmallOrderDetailDataString = responseString.match(/var detailData = (.*)/);

                if (taoBaoOrderDetailDataString !== null) {
                    praseOrderDetailJSONData(orderItemIndex, taoBaoOrderDetailDataString[1], "taoBaoOrderDetail");
                } else if (tmallOrderDetailDataString !== null) {
                    praseOrderDetailJSONData(orderItemIndex, tmallOrderDetailDataString[1], "tmallOrderDetail");
                } else {
                    console.info("详情网页响应文本 JSON数据[" + orderItemIndex + "]: 未找到！");
                }

                if (httpGetResult.orderDetailCount === 0) {
                    httpGetResult.isOrderDetailFinish = true;

                    console.timeEnd("getDataFromOrderDetail");
                    console.info("获取订单详情数据结束！");

                    document.getElementById("addOrdersToDetail").style.background = "#4CAF50";
                    document.getElementById("tp-bought-root").addEventListener("click", ResetButtonStatus);

                    Toast("添加 " + httpGetResult.orderDetailTotal + " 条订单详情,添加 " + Object.keys(orderDetail).length + " 条详情,已添加 " + Object.keys(orderList).length + " 条子订单。");
                    console.info("添加 " + httpGetResult.orderDetailTotal + " 条订单详情,添加 " + Object.keys(orderDetail).length + " 条详情,已添加 " + Object.keys(orderList).length + " 条子订单。");

                    console.info("订单详情数据:");
                    console.info(orderDetail);

                    console.info("开始合并订单列表和订单详情数据");
                    orderList = mergeDetailAndList(orderList, orderDetail);
                }
            },
        });
    }, randomTimeout);
}

//订单列表数据预处理: 分类和去重
function preprocessOrderList(orderListData) {
    var DetailUrlDomain = null;
    var orderInfoIdIndexList = [];

    var orderListCount = {
        ["allClass"]: 0,
        ["unique"]: 0,
        ["taoBao"]: 0,
        ["tmall"]: 0,
        ["archive"]: 0,
    };

    var taoBaoOrderList = {};
    var tmallOrderList = {};
    var archiveOrderList = {};
    var orderListTemp = {};

    for (let orderItemIndex in orderListData) {
        orderListCount.allClass++;

        var orderInfoId = orderListData[orderItemIndex]["mainOrderID"];
        DetailUrlDomain = orderListData[orderItemIndex]["DetailURL"].match(/https:\/\/(.*)\.com/);
        if (DetailUrlDomain !== null) {
            DetailUrlDomain = DetailUrlDomain[1];
        }

        //订单去重
        if (orderInfoIdIndexList.includes(orderInfoId) === false) {
            orderListCount.unique++;
            orderInfoIdIndexList.push(orderInfoId);
        } else {
            continue;
        }

        //订单分类
        if (DetailUrlDomain.includes("trade.taobao") === true) {
            orderListCount.taoBao++;
            taoBaoOrderList[orderItemIndex] = orderListData[orderItemIndex];
        } else if (DetailUrlDomain.includes("trade.tmall") === true) {
            orderListCount.tmall++;
            tmallOrderList[orderItemIndex] = orderListData[orderItemIndex];
        } else if (DetailUrlDomain.includes("tradearchive.taobao") === true) {
            orderListCount.archive++;
            archiveOrderList[orderItemIndex] = orderListData[orderItemIndex];
        } else {
            Toast("不支持的订单详情类型:" + DetailUrlDomain);
            console.info("不支持的订单详情类型:" + DetailUrlDomain);
        }
    }

    orderListTemp = {
        ["taoBaoOrderList"]: taoBaoOrderList,
        ["tmallOrderList"]: tmallOrderList,
        ["archiveOrderList"]: archiveOrderList,
    };

    console.info("总共 " + orderListCount.allClass + " 个子订单。去重后为" + orderListCount.unique + "个订单。");
    console.info("总共 " + orderListCount.unique + " 个订单。分类后为" + orderListCount.taoBao + "个淘宝订单," + orderListCount.tmall + "个天猫订单," + orderListCount.archive + "个存档订单。");
    console.info("处理后的订单列表数据为:");
    console.info(orderListTemp);

    return orderListTemp;
}

//合并订单列表和订单详情数据
function mergeDetailAndList(orderListData, orderDetailData) {
    var isSame = null;
    var orderListTemp = orderListData;

    for (let orderItemIndex in orderDetailData) {
        isSame = false;

        //console.info("开始合并订单列表和订单详情数据[" + orderItemIndex + "]:");
        //console.info("订单列表数据[" + orderItemIndex + "]", orderListData[orderItemIndex]);
        //console.info("订单详情数据[" + orderItemIndex + "]", orderDetailData[orderItemIndex]);

        //根据子订单ID以及商品分类和商品名称判断是否为同一条子订单 (注：天猫超市的此项参数为空！)
        if (orderListData[orderItemIndex]["subOrderID"] === orderDetailData[orderItemIndex]["subOrderID"]) {
            isSame = true;
        } else if (orderListData[orderItemIndex]["SKUName"] === orderDetailData[orderItemIndex]["SKUName"]) {
            if (orderListData[orderItemIndex]["productName"] === orderDetailData[orderItemIndex]["snapName"]) {
                isSame = true;
            } else if (orderListData[orderItemIndex]["snapName"] === orderDetailData[orderItemIndex]["snapName"]) {
                isSame = true;
            }
        }

        if (isSame === true) {
            //修复订单列表中的数据缺失
            if (orderListData[orderItemIndex]["snapURL"] === "") {
                orderListTemp[orderItemIndex]["snapURL"] = orderDetailData[orderItemIndex]["snapURL"];
                orderListTemp[orderItemIndex]["subOrderID"] = orderDetailData[orderItemIndex]["snapURL"].match(/ID=(\d*)/i)[1];
                orderListTemp[orderItemIndex]["snapName"] = orderDetailData[orderItemIndex]["snapName"]; //！数据采集于订单详情页面！
            }

            //添加时间日期和物流信息
            orderListTemp[orderItemIndex]["dateTime"] = orderDetailData[orderItemIndex]["dateTime"];
            orderListTemp[orderItemIndex]["logisticsName"] = orderDetailData[orderItemIndex]["logisticsName"];
            orderListTemp[orderItemIndex]["logisticsNum"] = orderDetailData[orderItemIndex]["logisticsNum"];
        } else {
            console.info("订单列表和订单详情数据合并结果[" + orderItemIndex + "]: 不相同！");
            console.info("订单列表数据[" + orderItemIndex + "]", orderListData[orderItemIndex]);
            console.info("订单详情数据[" + orderItemIndex + "]", orderDetailData[orderItemIndex]);
        }
    }

    console.info("整合前的数据为:");
    console.info("订单列表数据", orderListData);
    console.info("订单详情数据", orderDetailData);

    console.info("整合订单详情后的订单列表数据为:");
    console.info(orderListTemp);

    return orderListTemp;
}

//订单列表数据后处理: 可选功能处理和重定位
function postprocessOrderList(orderListData) {
    var orderListTemp = {};

    if (httpGetResult.orderDetailTotal !== 0) {
        orderHeaderList.push("日期时间");
        orderHeaderList.push("物流公司");
        orderHeaderList.push("物流单号");
    }

    for (let orderItemIndex in orderListData) {
        orderListTemp[orderItemIndex] = [];

        //选择图片尺寸
        var picURL = orderListData[orderItemIndex]["picURL"];
        if (imageDimensionsList[imageDimensionsIndex] === "800x800") {
            picURL = picURL.replace(/_80x80.(jpg|png)/, "");
        } else {
            picURL = picURL.replace(/\d*x\d*(?=.(jpg|png))/, imageDimensionsList[imageDimensionsIndex]);
        }

        //Excel数据格式适配
        const isEnableDataFormatAdaptation = document.getElementById("DataFormatAdaptationStatus").checked;
        if (isEnableDataFormatAdaptation === true) {
            var mainOrderID = orderListData[orderItemIndex]["mainOrderID"];
            var subOrderID = orderListData[orderItemIndex]["subOrderID"];
            var logisticsNum = orderListData[orderItemIndex]["logisticsNum"];

            mainOrderID = '"' + mainOrderID + '\t"';
            subOrderID = '"' + subOrderID + '\t"';

            if (orderListData[orderItemIndex]["logisticsName"] !== undefined) {
                logisticsNum = '"' + logisticsNum + '\t"';
            }
        }

        //订单详情链接一致化
        const isEnableUrlUniformization = document.getElementById("UrlUniformizationStatus").checked;
        if (isEnableUrlUniformization === true) {
            var DetailURL = orderListData[orderItemIndex]["DetailURL"];

            const recentTaoBaoOrderDetailUrlPrefix = "buyertrade.taobao.com/trade/detail/trade_item_detail"; //最近的淘宝订单详情链接前缀
            const recentTmallOrderDetailUrlPrefix = "trade.tmall.com/detail/orderDetail"; //最近的天猫订单详情链接前缀
            const passedOrderDetailUrlPrefix = "tradearchive.taobao.com/trade/detail/trade_item_detail"; //过去的淘宝和天猫订单详情链接前缀

            DetailURL = DetailURL.replace(recentTmallOrderDetailUrlPrefix, recentTaoBaoOrderDetailUrlPrefix);
            DetailURL = DetailURL.replace(passedOrderDetailUrlPrefix, recentTaoBaoOrderDetailUrlPrefix);
        }

        //数据项重定位
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("下单日期")] = orderListData[orderItemIndex]["createDate"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("订单编号")] = mainOrderID;
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("子订单编号")] = subOrderID;
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("店铺名称")] = orderListData[orderItemIndex]["shopName"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("商品名称")] = orderListData[orderItemIndex]["productName"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("快照名称")] = orderListData[orderItemIndex]["snapName"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("分类名称")] = orderListData[orderItemIndex]["SKUName"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("主图链接")] = picURL;
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("商品链接")] = orderListData[orderItemIndex]["productURL"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("快照链接")] = orderListData[orderItemIndex]["snapURL"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("单价")] = orderListData[orderItemIndex]["price"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("数量")] = orderListData[orderItemIndex]["quantity"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("订单实付款")] = orderListData[orderItemIndex]["actualFee"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("商品退款状态")] = orderListData[orderItemIndex]["refundStatus"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("订单交易状态")] = orderListData[orderItemIndex]["tradeStatus"];
        orderListTemp[orderItemIndex][orderHeaderList.indexOf("订单详情链接")] = DetailURL;

        if (httpGetResult.orderDetailTotal !== 0) {
            orderListTemp[orderItemIndex][orderHeaderList.indexOf("日期时间")] = orderListData[orderItemIndex]["dateTime"];

            if (orderListData[orderItemIndex]["logisticsName"] !== undefined) {
                orderListTemp[orderItemIndex][orderHeaderList.indexOf("物流公司")] = orderListData[orderItemIndex]["logisticsName"];
                orderListTemp[orderItemIndex][orderHeaderList.indexOf("物流单号")] = logisticsNum;
            }
        }
    }

    console.info("进行可选功能处理和重定位后的订单列表数据为:");
    console.info(orderListTemp);

    return orderListTemp;
}

//解析订单详情数据
function praseOrderDetailJSONData(orderItemIndex, JSONString, OrderDetailClass) {
    var dateTime = "";
    var mainOrderid = "";
    var subOrderid = "";
    var snapName = "";
    var SKUName = "";
    var snapURL = "";
    var logisticsName = "";
    var logisticsNum = "";

    var index = 0;
    var orderItemIndexTemp = "";

    var JSONData = {};
    var orderDetailTemp = {};

    //解析订单详情数据: 淘宝
    if (OrderDetailClass === "taoBaoOrderDetail") {
        JSONString = JSONString.replace(/\\u/g, "%u");
        JSONString = JSONString.replace(/\\(.)/g, "$1");
        JSONString = unescape(JSONString);
        //console.info("详情网页响应文本 JSON数据 字符串 淘宝["+orderItemIndex+"]:" + JSONString);

        JSONData = JSON.parse(JSONString);
        //console.info("详情网页响应文本 JSON数据 匹配数据 淘宝[" + orderItemIndex + "]:" + JSONData);
        //console.info(JSONData);

        dateTime = JSONData.orderBar.nodes[0].date;
        mainOrderid = JSONData.mainOrder.id;

        if (JSONData.mainOrder.statusInfo.text.includes("交易关闭") !== true) {
            logisticsName = JSONData.deliveryInfo.logisticsName;
            logisticsNum = JSONData.deliveryInfo.logisticsNum;
        }

        for (let subOrderItem of JSONData.mainOrder.subOrders) {
            index++;

            snapName = subOrderItem.itemInfo.title;

            SKUName = "";
            if (subOrderItem.itemInfo.hasOwnProperty("skuText") === true) {
                for (let skuTextItem of subOrderItem.itemInfo.skuText[0].content) {
                    SKUName += skuTextItem.value.name;
                    SKUName += skuTextItem.value.value;
                    SKUName += " ";
                }
                SKUName = SKUName.replace(/颜色分类：?/, " ");
                SKUName = SKUName.trim();
            }

            snapURL = "https:" + subOrderItem.itemInfo.auctionUrl + "&snapShot=true";

            if (snapURL.match(/ID=\d*/i) !== null) {
                subOrderid = snapURL.match(/ID=(\d*)/i)[1];
            }

            orderItemIndexTemp = mainOrderid + index;
            orderDetailTemp[orderItemIndexTemp] = {
                ["dateTime"]: dateTime,
                ["mainOrderID"]: mainOrderid,
                ["subOrderID"]: subOrderid,
                ["snapName"]: snapName,
                ["SKUName"]: SKUName,
                ["snapURL"]: snapURL,
                ["logisticsName"]: logisticsName,
                ["logisticsNum"]: logisticsNum,
            };
        }
        //解析订单详情数据: 天猫
    } else if (OrderDetailClass === "tmallOrderDetail") {
        JSONData = JSON.parse(JSONString);
        //console.info("详情网页响应文本 JSON数据 匹配数据 天猫[" + orderItemIndex + "]:" + JSONData);
        //console.info(JSONData);

        //解析订单详情数据: 非天猫超市
        if (JSONData.basic.lists[2].content[0].text.search("天猫超市") === -1) {
            if (JSONData.basic.lists[2].content.hasOwnProperty("1") === true) {
                dateTime = JSONData.basic.lists[2].content[1].moreList[1].content[0].text;
                mainOrderid = JSONData.basic.lists[2].content[0].text;
            } else {
                dateTime = JSONData.basic.lists[4].content[1].moreList[1].content[0].text;
                mainOrderid = JSONData.basic.lists[4].content[0].text;
            }

            if (JSONData.orders.list[0].status[0].statusInfo[0].text !== "已取消") {
                logisticsName = JSONData.orders.list[0].logistic.content[0].companyName;
                logisticsNum = JSONData.orders.list[0].logistic.content[0].mailNo;
            }

            for (let subOrderItem of JSONData.orders.list[0].status) {
                index++;

                snapName = subOrderItem.subOrders[0].itemInfo.title;

                SKUName = "";
                if (subOrderItem.subOrders[0].itemInfo.hasOwnProperty("skuText") === true) {
                    for (let skuTextItem of subOrderItem.subOrders[0].itemInfo.skuText) {
                        if (skuTextItem.key === "发货时间") {
                            continue;
                        }
                        SKUName += skuTextItem.key;
                        SKUName += "：";
                        SKUName += skuTextItem.content[0].text;
                        SKUName += " ";
                    }
                    SKUName = SKUName.replace(/颜色分类：?/, " ");
                    SKUName = SKUName.trim();
                }

                snapURL = "https:" + subOrderItem.subOrders[0].itemInfo.snapUrl + "&snapShot=true";

                if (snapURL.match(/ID=\d*/i) !== null) {
                    subOrderid = snapURL.match(/ID=(\d*)/i)[1];
                }

                orderItemIndexTemp = mainOrderid + index;
                orderDetailTemp[orderItemIndexTemp] = {
                    ["dateTime"]: dateTime,
                    ["mainOrderID"]: mainOrderid,
                    ["subOrderID"]: subOrderid,
                    ["snapName"]: snapName,
                    ["SKUName"]: SKUName,
                    ["snapURL"]: snapURL,
                    ["logisticsName"]: logisticsName,
                    ["logisticsNum"]: logisticsNum,
                };
            }
            //解析订单详情数据: 天猫超市
        } else {
            //console.info("详情网页响应文本 JSON数据 匹配数据 天猫超市[" + orderItemIndex + "]:" + JSONData);
            //console.info(JSONData);

            dateTime = JSONData.basic.lists[1].content[1].moreList[1].content[0].text;
            mainOrderid = JSONData.basic.lists[1].content[0].text;

            for (let subOrderItem of JSONData.orders.list) {
                index++;

                if (subOrderItem.status[0].statusInfo[0].text !== "已取消") {
                    logisticsName = subOrderItem.logistic.content[0].companyName;
                    logisticsNum = subOrderItem.logistic.content[0].mailNo;
                }

                snapName = subOrderItem.status[0].subOrders[0].itemInfo.title;

                SKUName = "";
                if (subOrderItem.status[0].subOrders[0].itemInfo.hasOwnProperty("skuText") === true) {
                    for (let skuTextItem of subOrderItem.status[0].subOrders[0].itemInfo.skuText) {
                        if (skuTextItem.key === "发货时间") {
                            break;
                        }
                        SKUName += skuTextItem.key;
                        SKUName += "：";
                        SKUName += skuTextItem.content[0].text;
                        SKUName += " ";
                    }
                    SKUName = SKUName.replace(/颜色分类：?/, " ");
                    SKUName = SKUName.trim();
                }

                snapURL = "https:" + subOrderItem.status[0].subOrders[0].itemInfo.snapUrl + "&snapShot=true";

                if (snapURL.match(/ID=\d*/i) !== null) {
                    subOrderid = snapURL.match(/ID=(\d*)/i)[1];
                }

                orderItemIndexTemp = mainOrderid + index;
                orderDetailTemp[orderItemIndexTemp] = {
                    ["dateTime"]: dateTime,
                    ["mainOrderID"]: mainOrderid,
                    ["subOrderID"]: subOrderid,
                    ["snapName"]: snapName,
                    ["SKUName"]: SKUName,
                    ["snapURL"]: snapURL,
                    ["logisticsName"]: logisticsName,
                    ["logisticsNum"]: logisticsNum,
                };
            }
        }
    } else {
        console.info("详情网页响应文本 JSON数据[" + orderItemIndex + "]: 不支持的订单详情类型!");
    }

    //过滤黑名单项：如"保险服务"、"增值服务"、"买家秀"等;
    const isEnableBlackList = document.getElementById("BlackListStatus").checked;
    if (isEnableBlackList === true && blackList.length > 0) {
        for (let orderItemIndex in orderDetailTemp) {
            var ProductName = orderDetailTemp[orderItemIndex]["snapName"];
            var searchResult = false;

            for (let item of blackList) {
                if (ProductName.search(item) !== -1) {
                    searchResult = true;
                    break;
                }
            }

            if (searchResult === true) {
                continue;
            } else {
                orderDetail[orderItemIndex] = orderDetailTemp[orderItemIndex];
            }
        }
    }

    console.info("正在获取订单详情数据...");
    //console.info("详情网页响应文本 JSON数据 目标数据[" + orderItemIndex + "]:");
    //console.info(orderDetailTemp);
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

        while (true) {
            if (index === 0) {
                var ShopNameQuery = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:0.0.1.0.1']");
                var actualFeeQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$4.0.0.2.0.1']");
                var tradeStatusQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$5.0.0.0.0']");
                var DetailUrlQuery1 = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$5.0.1.$0.0.0']");
                var DetailUrlQuery2 = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$5.0.1.$1.0.0']");
            }

            var ProductPicUrlQuery = order.querySelector("img[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.0.0.0.0']");
            var ProductUrlQuery = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.0.0']");
            var ProductNameQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.0.0.1']");
            var snapshotUrlQuery = order.querySelector("a[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.0.1']");
            var SKUNameQuery = order.querySelector("p[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$0.0.1.1']");
            var RealPriceQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$1.0.1.1']");
            var quantityQuery = order.querySelector("p[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$2.0.0']");
            var refundStatusQuery = order.querySelector("span[data-reactid='.0.7:$order-" + id + ".$" + id + ".0.1:1:0.$" + index + ".$3.0.$0.0.0.$text']");

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
            var subOrdersIteminfoPicUrl = ProductPicUrlQuery === null ? "" : ProductPicUrlQuery.src;
            var subOrdersIteminfoProductUrl = ProductUrlQuery === null ? "" : ProductUrlQuery.href;
            var subOrdersIteminfoProductName = ProductNameQuery.textContent;
            var subOrdersIteminfoSnapUrl = snapshotUrlQuery === null ? "" : snapshotUrlQuery.href;

            var subOrdersIteminfoId = "";
            if (subOrdersIteminfoSnapUrl.match(/ID=\d*/i) !== null) {
                subOrdersIteminfoId = subOrdersIteminfoSnapUrl.match(/ID=(\d*)/i)[1];
            }

            var subOrdersIteminfoSKUName = "";
            if (SKUNameQuery !== null) {
                var SKUNameChildrenList = SKUNameQuery.children;
                for (let SKUNameChildrenItem of SKUNameChildrenList) {
                    subOrdersIteminfoSKUName += SKUNameChildrenItem.innerText + " ";
                }
            }

            var subOrdersPriceinfoRealPrice = RealPriceQuery === null ? "" : RealPriceQuery.textContent;
            var subOrdersQuantityCount = quantityQuery === null ? "" : quantityQuery.textContent;
            var subOrdersRefund = refundStatusQuery === null ? "" : refundStatusQuery.innerText === "查看退款" ? "退款" : "";
            var payInfoActualFee = actualFeeQuery === null ? "" : actualFeeQuery.textContent;
            var statusInfoStatus = tradeStatusQuery === null ? "" : tradeStatusQuery.textContent;
            var statusInfoDetailUrl = DetailUrlQuery1 === null ? (DetailUrlQuery2 === null ? "" : DetailUrlQuery2.href) : DetailUrlQuery1.href;

            var subOrdersSnapshotProductName = "";

            //精简数据
            subOrdersIteminfoProductUrl = subOrdersIteminfoProductUrl.replace(/&_u=\w*/, "");
            subOrdersIteminfoSKUName = subOrdersIteminfoSKUName.replace(/颜色分类：?/, " ");
            subOrdersIteminfoSKUName = subOrdersIteminfoSKUName.trim();

            //项目标题在序列中的位置自动同步到项目数据在序列中的位置
            orderData[orderItemIndex] = {
                ["createDate"]: orderInfoDate,
                ["mainOrderID"]: orderInfoId,
                ["subOrderID"]: subOrdersIteminfoId,
                ["shopName"]: sellerInfoShopName,
                ["productName"]: subOrdersIteminfoProductName,
                ["snapName"]: subOrdersSnapshotProductName,
                ["SKUName"]: subOrdersIteminfoSKUName,
                ["picURL"]: subOrdersIteminfoPicUrl,
                ["productURL"]: subOrdersIteminfoProductUrl,
                ["snapURL"]: subOrdersIteminfoSnapUrl,
                ["price"]: subOrdersPriceinfoRealPrice,
                ["quantity"]: subOrdersQuantityCount,
                ["actualFee"]: payInfoActualFee,
                ["refundStatus"]: subOrdersRefund,
                ["tradeStatus"]: statusInfoStatus,
                ["DetailURL"]: statusInfoDetailUrl,
            };
        }
    }
    return orderData;
}
