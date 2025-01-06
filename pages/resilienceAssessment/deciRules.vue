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
            { label: 'Elasticity Modulus', value: 'elasticityModulus' },
            { label: 'Structural Adhesive Stress', value: 'structuralAdhesiveStress' },
            { label: 'Panel Damage Area', value: 'panelDamageArea' },
            { label: 'Structural Adhesive Damage Length', value: 'structuralAdhesiveDamageLength' },
            { label: 'Connectors Number', value: 'connectorsNumber' },
            { label: 'Back Bolts Number', value: 'backBoltsNumber' },
            { label: 'Panel Verticality', value: 'panelVerticality' },
            { label: 'Stitching Width', value: 'stitchingWidth' },
            { label: 'PanelSize', value: 'panelSize' },
            { label: 'Offset X', value: 'Offset_x' },
            { label: 'Offset Y', value: 'Offset_y' },
            { label: 'Offset Z', value: 'Offset_z' },
            { label: 'Flatness', value: 'flatness' },
            { label: 'Stains', value: 'stains' },
            { label: 'Cracks', value: 'cracks' },
        ]);

        // 用户选择的列
        const selectedColumns = ref<string[]>([]);

        //储存返回的数据
        const responseData = ref<any[]>([]);

        // 控制提示信息显示的变量
        const showDeciRulestip = ref(false);

        // 切换提示信息显示状态的方法
        function toggleDeciRulestip() {
            showDeciRulestip.value = !showDeciRulestip.value;
        }

        // 执行API调用
        const submitSelection = async () => {
            listLoading.value = true;
            try {
                if (selectedColumns.value.length < 3) {
                    ElMessage.error('Please select at least 3 columns.');
                    // 重置选择项
                    selectedColumns.value = [];
                    return;
                } else if (selectedColumns.value.length > 6) {
                    ElMessage.error('You can select up to 6 columns.');
                    // 限制选择项数量
                    selectedColumns.value = selectedColumns.value.slice(0, 6);
                    return;
                }

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
            toggleDeciRulestip,
            showDeciRulestip,
        };
    },
});

</script>

<template>
    <div>
        <!-- <h1>决策规则分析</h1> -->
        <!--决策规则提示信息-->
        <div style="margin-left: 10px; margin-top: 10px;" 
            title="You can select 3-6 attributes below, and use the last one as the decision attribute and the previous ones as analysis attributes to form a decision rule and analyze the support, confidence and lift values ​​of this decision rule. The '0, 1, 2, 3' in the table represent different value ranges of the attributes (see the division description below for details), and the empty cells represent null values"
            >
            <div v-if="selectedColumns.length > 2 && selectedColumns.length < 7">
                <span style="margin-left: 10px; margin-right: 5px; font-size: 16px; color: #5dade2;">
                    Your Decision Rule:
                </span>
                <span v-for="(column, index) in selectedColumns.slice(0, -1)" :key="index" style="font-size: 12px; color: #606266;">
                    {{ column }}
                    <span v-if="index < selectedColumns.length - 2" style="font-size: 12px; color: #606266;">, </span>
                    <span v-else style="font-size: 12px; color: #606266;">——></span>
                </span>
                <span style="margin-left: 2px; margin-right: 5px; font-size: 16px; color: #5dade2;">
                    {{ selectedColumns[selectedColumns.length - 1] }}
                </span>
            </div>
            <div v-else>
                <span style="margin-left: 10px; margin-right: 5px; font-size: 16px; color: #606266;">
                    Please select 3-6 attributes to construct your decision rule...
                </span>
            </div>
        </div>

        <!-- 下拉列表 -->
        <div class="filter-container" style="margin-left: 10px; margin-top: 10px;">
            <label for="batch-input" style="margin-left: 10px; margin-right: 5px; font-size: 16px; color: #606266;">Batch: </label>
            <el-input
            type="number"
            v-model="batch.value"
            placeholder="Batch"
            style="width: 100px;"
            />
            
        </div>

        <div class="filter-container" style="margin-left: 10px; margin-top: 10px;">
            <label for="thresholds-input" style="margin-left: 10px; margin-right: 5px; font-size: 16px; color: #606266;">Evaluation Attributes Selection: </label>
            <el-select
                v-model="selectedColumns"
                multiple
                placeholder="Please select the required columns"
                style="width: 600px;margin-right: 5px;"
            >
                <el-option
                v-for="option in columnOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
                ></el-option>
            </el-select>
        
            <!-- 提交按钮 -->
            <!-- <button @click="submitSelection">Submit</button> -->
            <el-button
                type="primary"
                class="filter-item"
                icon="el-icon-refresh"
                @click="submitSelection"
            >
                Submit
            </el-button>
        </div>

        <div>
            <!-- 点击按钮来展开或收起提示信息 -->
            <button @click="toggleDeciRulestip" style="margin-left: 20px; margin-right: 10px; font-size: 12px; color: #606266;">Click to expand/collapse threshold division details</button>

            <!-- 提示信息容器 -->
            <div v-if="showDeciRulestip" style="margin-left: 20px; margin-right: 5px; font-size: 12px; color: #606266;">
            每一个属性通过下面的阈值划分为4个区间，用“0,1,2,3”来表示: <br>
            'elasticityModulus': [2350,2700,3000],
            'structuralAdhesiveStress': [75,120,150],
            'panelDamageArea': [3,6,10],<br>
            'structuralAdhesiveDamageLength': [1.5,3,5],
            'connectorsNumber': [20,35,50],
            'backBoltsNumber': [10,15,20],<br>
            'panelVerticality':[94,97,100],
            'stitchingWidth': [0.5,0.75,1.0],
            'panelSize': [1.5,2.2,3],<br>
            'Offset_x': [-0.1,0.2,0.5],
            'Offset_y': [-0.1,0.2, 0.5],
            'Offset_z': [-0.1,0.2,0.5],<br>
            'flatness': [0.4,0.75,1.0],
            'stains': [0.4,0.75,1.0],
            'cracks': [0.4,0.75,1.0]
            </div>
        </div>

        <!-- 显示数据表格 -->
        <div class="table-container" 
            style="max-height: 500px; 
                max-width: 1000px; 
                overflow-y: auto; 
                overflow-x: auto; 
                margin-top: 10px; 
                margin-left: 10px;
                border: 1px solid #dcdfe6;"
        >
            <!-- 显示数据表格 -->
            <el-table :data="responseData" style="width: 100%;" v-if="responseData.length > 0" v-loading="listLoading.value">
                <!-- 动态生成列 -->
                <el-table-column
                v-for="(column, index) in Object.keys(responseData[0])"
                :key="index"
                :prop="column"
                :label="column"
                width="80"
                />
            </el-table>
        </div>
    </div>
</template>

<style scoped>

</style>