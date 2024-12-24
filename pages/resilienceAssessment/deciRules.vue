<script lang="ts">


import { defineComponent, ref, reactive } from 'vue';
import axios from 'axios';

export default defineComponent({
    name: 'ColumnSelector',
    setup() {
        const listLoading = reactive({ value: false });
        const batch = reactive({ value: 1 });

        // 下拉选项 (columns)
        const columnOptions = ref([
            { label: '弹性模量', value: 'elasticityModulus' },
            { label: '结构胶粘应力', value: 'structuralAdhesiveStress' },
            { label: '面板损坏面积', value: 'panelDamageArea' },
            { label: '结构胶粘损坏长度', value: 'structuralAdhesiveDamageLength' },
            { label: '连接器数量', value: 'connectorsNumber' },
            { label: '背部螺栓数量', value: 'backBoltsNumber' },
            { label: '平面垂直度', value: 'panelVerticality' },
            { label: '拼接宽度', value: 'stitchingWidth' },
            { label: '平面尺寸', value: 'panelSize' },
        ]);

        // 用户选择的列
        const selectedColumns = ref<string[]>([]);

        //储存返回的数据
        const responseData = ref<any[]>([]);

        // 执行API调用
        const submitSelection = async () => {
            listLoading.value = true;
            try {
                const batchId = batch.value; // 示例批次ID
                //console.log('输入数组：', Array.from(selectedColumns.value));
                
                // 使用参数传递的方法会出错，只能将url直接写出
                const url = `http://110.42.214.164:8005/evalu/rs-deci-rules?batch=${batchId}&input_columns=${selectedColumns.value.join('&input_columns=')}`;
                console.log('URL:',url);
                const response = await axios.get(url);

                console.log('API响应:', response.data);
                responseData.value = response.data.data;
            } catch (error) {
                console.error('API调用错误:', error);
            } finally {
                listLoading.value = false;
            }
        };

        return {
            columnOptions,
            selectedColumns,
            submitSelection,
            responseData,
            listLoading,
            batch,
        };
    },
});

</script>

<template>
    <div>
        <h1>决策规则分析</h1>
        <!-- 下拉列表 -->
        <span>批次选择</span>
        <el-input
        type="number"
        v-model="batch.value"
        placeholder="Batch"
        style="width: 100px;"
        />
        <span>评估属性选择</span>
        <el-select
        v-model="selectedColumns"
        multiple
        placeholder="请选择需要的列"
        style="width: 600px;"
        >
            <el-option
            v-for="option in columnOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
            ></el-option>
        </el-select>
    
        <!-- 提交按钮 -->
        <button @click="submitSelection">提交</button>

        <!-- 显示数据表格 -->
        <el-table :data="responseData" style="width: 100%" v-if="responseData.length > 0" v-loading="listLoading.value">
            <!-- 动态生成列 -->
            <el-table-column
            v-for="(column,index) in Object.keys(responseData[0])"
            :key="index"
            :prop="column"
            :label="column"
            />
        </el-table>
    </div>
</template>

<style scoped>

</style>