import Watcher from "./watcher";

export default class Compiler {
    constructor(context) {
        this.$el = context.$el;
        this.context = context;
        if (this.$el) {
            // 把原始的DOM转换为文档片段
            this.$fragment = this.node2Fragment(this.$el);
            // 编译模板
            this.compile(this.$fragment);
            // 把文档片段添加到页面中
            this.$el.appendChild(this.$fragment);
        }
    }


    /**
     * 把所有的元素转为文档片段
     * @param {*} node 
     */
    node2Fragment(node) {
        let fragment = document.createDocumentFragment();
        if (node.childNodes && node.childNodes.length) {
            node.childNodes.forEach(child => {
                // 判断是不是我们需要添加的节点
                // 如果是注释节点或者无用的换行等则不添加到文档片段中去
                if (!this.ignore(child)) {
                    fragment.appendChild(child);
                }
            })
        }
        return fragment;
    }

    /**
     * 忽略不需要添加到文档片段中的节点
     * @param {*} node 
     */
    ignore(node) {
        // 制表符、换行、回车 都是不需要的
        var reg = /^[\t\n\r]/;
        return (
            // 每个节点都有个节点类型属性（nodeType）对应的值分别是：1元素、3文本、8注释
            // 如果是注释，则直接忽略
            // 如果是文本，则要进行正则匹配，看是否是制表、换行、回车等，若是，则也忽略
            node.nodeType === 8 || (node.nodeType === 3 && reg.test(node.textContent))
        );
    }


    /**
     * 模板编译
     * @param {*} node 
     */
    compile(node) {
        if (node.childNodes && node.childNodes.length) {
            node.childNodes.forEach(child => {
                if (child.nodeType === 1) {
                    // 当nodeType为1时，说明是元素节点
                    this.compileElementNode(child);
                } else if (child.nodeType === 3) {
                    // 当nodeType为3时，说明是文本节点
                    this.compileTextNode(child);
                }
            })
        }
    }

    /**
     * 编译元素节点
     * @param {*} node 
     */
    compileElementNode(node) {
        let that = this;
        let attrs = [...node.attributes];
        attrs.forEach(attr => {
            // 解构赋值取出 属性名称 和 属性值
            let { name: attrName, value: attrValue } = attr;
            // 如果是 s- 开头的，说明是 指令
            if (attrName.indexOf('s-') === 0) {
                let dirName = attrName.slice(2);
                switch (dirName) {
                    case "text":
                        new Watcher(attrValue, this.context, newValue => {
                            node.textContent = newValue;
                        }); 
                        break;
                    case "model":
                        new Watcher(attrValue, this.context, newValue => {
                            // 单向绑定，数据发生变化时，表单显示也会变
                            node.value = newValue;
                        })
                        // 双向绑定，表单元素发生变化时，数据也会变
                        node.addEventListener("input", e => {
                            that.context[attrValue] = e.target.value;
                        })
                        break;
                }
            }
            // 如果是 @ 开头的，说明是 事件
            if (attrName.indexOf("@") === 0) {
                this.compileMethods(this.context, node, attrName, attrValue);
            }
        })
        // 元素节点还可能有很多子节点或孙子节点等，因此还需递归处理
        this.compile(node);
    }

    /**
     * 编译函数
     * @param {*} scope 
     * @param {*} node 
     * @param {*} attrName 
     * @param {*} attrValue 
     */
    compileMethods(scope, node, attrName, attrValue) {
        // 获取类型
        let type = attrName.slice(1);
        let fn = scope[attrValue];
        node.addEventListener(type, fn.bind(scope));
    }


    /**
     * 编译文本节点
     * @param {*} node 
     */
    compileTextNode(node) {
        let text = node.textContent.trim();
        if (text) {
            // 把text字符串转换为表达式
            let exp = this.parseExp(text);
            // 添加订阅者，计算表达式的值
            // 当表达式依赖的数据发生变化时
            // 1.重新计算表达式的值
            // 2.更新node.textContent
            // 即可完成 Model -> View 的响应式
            new Watcher(exp, this.context, newValue => {
                node.textContent = newValue;
            })
        }
    }

    /**
     * 该函数完成文本到表达式的转换
     * @param {*} text 
     */
    parseExp(text) {
        // 插值表达式{{...}} 的 正则匹配表达式
        // +限定符是贪婪的，会尽可能多的匹配文字，通过在后面加一个?实现非贪婪或最小匹配
        let regText = /\{\{(.+?)\}\}/g;
        // match()方法 返回与正则表达式匹配的结果
        let matches = text.match(regText);
        // 分割插值表达式前后内容（如果有的话）
        // split()方法 使用指定分隔符 将一个字符串分割成 子字符串数组
        // 分隔符可以是一个字符串或正则表达式，此处即使用正则表达式
        // 由于此处的正则表达式regText中包含捕获括号，因此其匹配结果也将包含在返回的数组pieces中
        let pieces = text.split(regText);
        // 表达式数组
        let tokens = [];
        pieces.forEach(item => {
            if (matches && matches.indexOf('{{' + item + '}}') > -1) {
                tokens.push('(' + item + ')');
            } else {
                tokens.push('`' + item + '`');
            }
        })
        return tokens.join('+');
    }
}