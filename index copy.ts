import promiseProxy from "./promise/index";
import util from '@/utils/indexT'
import { cloneDeep, mixin, defaultsDeep, split, isFunction, drop } from "lodash";
// 默认配置参数
const defaultProxy = {
    // 代理类型，默认为经典代理
    type: 'promise.classic',
    // 每次加载几条数据，默认为10
    pageSize: 10,
    // 当前页码，默认为1
    page: 1,
    // 分页每页显示条数字段名称，默认为limit，此参数传递到服务端
    limitParam: 'limit',
    // 分页页码字段名称，默认为page，此参数传递到服务端
    pageParam: 'page',
    // 当前分页配置节点名称，默认为page
    paginationParam: 'pagination',
    // 初始化后是否自动加载数据
    autoLoad: false,
    // 扩展，请求失败后执行函数
    failure: null,
    // 扩展，请求数据前处理请求参数函数
    writerTransform: null,
    // 扩展，请求数据成功后处理数据结果函数
    readerTransform: null,
    // 扩展 处理单个数据对象的函数
    disposeItem: null,
    // 读取数据相关配置
    reader: {
        // 数据根节点名称
        rootProperty: "data",
        // 判断请求是否成功的节点名称
        successProperty: "success",
        // 数据总数节点名称
        totalProperty: "total",
        // 请求失败后失败消息节点名称
        messageProperty: 'message'
    }
};
// 这是一个数据代理
// 俄罗斯套娃模式，支持向上向下扩展
// 数据源对象
// store={};
// 数据源对象挂载代理
// proxy.init(store);
// 数据源对象加载数据
// store.load(); => {data:[]}
export default {
    /**
        * 初始化
         *
         * @param {*} store,数据源对象
         */
    init(store: any) {
        console.log('proxy.init');
        const me = this as any,
            // 代理配置
            proxy = store.proxy,
            // 读取代理类型，用.分割
            key = split(proxy.type, '.');
        // 读取并设置默认配置，默认配置会新设置覆盖
        store.proxy = defaultsDeep(proxy, defaultProxy);
        // 将当前代理对象的方法挂载到数据源对象，代理对象的方法会覆盖代理对象原有的方法
        mixin(store, me);
        // 设置下一级代理类型
        store.proxy.type = drop(key).toString();
        // 根据代理类型第一级挂载代理对象
        switch (key[0]) {
            // 预留扩展，可以实现其他代理类
            default:
                // 初始化代理对象
                promiseProxy.init(store);
                break;
        }
        // 根据配置决定是否自动加载数据
        if (proxy.autoLoad) {
            store.load();
        }
    },
    /**
     * 数据加载结束执行
     *
     * @param {*} proxy 数据源对象代理
     * @param {*} { res 结果数据集, isError = false 是否加载失败}
     */
    loadEnd(proxy: any, { res, isError = false }) {
        // 标识请求数据完成
        proxy.isLoading = false;
        // 如果数据加载失败
        if (isError) {
            const me = this as any;
            // 如果有请求失败执行函数，执行它
            if (isFunction(me.failure)) {
                // 有时候请求失败需要额外的处理逻辑
                me.failure(res);
            }
        }
    },
    /**
     * 数据源对象加载数据，页码重置为1
     *
     * @param {*} [params 参数]
     */
    load(params?: any) {
        const me = this as any;
        if (params) {
            // 深度拷贝并处理掉空数据，避免数据变化引起bug
            params = util.clearObject(cloneDeep(params));
            // 如果有请求数据前处理请求参数函数，执行它
            if (isFunction(me.writerTransform)) {
                // 有时候需要在请求前处理参数
                params = me.writerTransform(params);
            }
        }
        me.proxy.params = params
        me.proxy.page = 1;
        me.loadByProxy();
    },
    /**
     * 数据源对象重载数据
     *
     */
    reLoad() {
        const me = this as any;
        me.load(me.proxy.params);
    }
}