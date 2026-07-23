/**
 * ConstitutionService — 体质服务
 */
import { constitutions, questionnaire } from '../data/index.js';
let constitutionCache = [];
export class ConstitutionService {
    static getConstitutionInfo(constitution, term = null) {
        const pools = constitutionCache.length ? constitutionCache : constitutions;
        constitutionCache = pools;
        if (term) {
            const match = pools.find(p => p.constitution_type === constitution && p.solar_term === term);
            if (match) {
                return {
                    type: constitution,
                    solar_term: term,
                    vulnerability_points: match.vulnerability_points,
                    direction_override: match.direction_override,
                    intensity_modifier: match.intensity_modifier,
                    focus_shift: match.focus_shift,
                    diet_additions: match.diet_additions,
                    diet_restrictions: match.diet_restrictions,
                };
            }
        }
        return this.getBaseConstitutionInfo(constitution);
    }
    static getBaseConstitutionInfo(constitution) {
        const infoMap = {
            '平和质': { name: '平和质', description: '阴阳平衡，体质正常，适应能力强', features: ['面色红润', '精力充沛', '适应力强', '睡眠好'], wellness_principle: '维持平衡，顺应节气养生', key_advice: '保持规律作息，均衡饮食，适量运动' },
            '气虚质': { name: '气虚质', description: '气虚为主，疲乏、气短、懒言、动则出汗', features: ['疲乏', '气短', '懒言', '动则出汗', '易感冒'], wellness_principle: '补气健脾，固表护卫', key_advice: '多食黄芪、党参、山药、大枣；避免过劳和生冷' },
            '阳虚质': { name: '阳虚质', description: '阳气不足，怕冷、手足不温、喜热饮', features: ['怕冷', '手足不温', '喜热饮', '大便稀溏'], wellness_principle: '温阳散寒，温补肾阳', key_advice: '多食生姜、桂圆、羊肉、核桃；避免寒凉食物和过度运动' },
            '阴虚质': { name: '阴虚质', description: '阴液不足，口燥咽干、手足心热、易失眠', features: ['口燥咽干', '手足心热', '易失眠', '大便干结'], wellness_principle: '养阴润燥，滋阴降火', key_advice: '多食银耳、百合、梨、石斛；避免辛辣和熬夜' },
            '痰湿质': { name: '痰湿质', description: '痰湿内盛，肥胖、胸闷、痰多、腹胀', features: ['肥胖', '胸闷', '痰多', '腹胀', '大便黏腻'], wellness_principle: '化痰祛湿，健脾理气', key_advice: '多食薏米、赤小豆、冬瓜、陈皮；避免油腻和甜食' },
            '湿热质': { name: '湿热质', description: '湿热内蕴，口苦、易长痘、小便黄、大便黏腻', features: ['口苦', '易长痘', '小便黄', '大便黏腻', '易急躁'], wellness_principle: '清热利湿，调理脾胃', key_advice: '多食绿豆、冬瓜、苦瓜、薏米；避免辛辣和油炸' },
            '血瘀质': { name: '血瘀质', description: '血瘀内阻，面色晦暗、易长斑、痛经、关节痛', features: ['面色晦暗', '易长斑', '痛经', '关节痛', '嘴唇暗'], wellness_principle: '活血化瘀，疏通气血', key_advice: '多食山楂、玫瑰花、红糖；避免生冷和久坐' },
            '气郁质': { name: '气郁质', description: '气机郁滞，情绪低落、胸闷、喜太息、易怒', features: ['情绪低落', '胸闷', '喜太息', '易怒', '睡眠差'], wellness_principle: '疏肝解郁，调畅情志', key_advice: '多食玫瑰花、薄荷、佛手；避免压抑和过度思虑' },
            '特禀质': { name: '特禀质', description: '先天禀赋异常，易过敏、易感冒、易哮喘', features: ['易过敏', '易感冒', '易哮喘', '皮肤敏感'], wellness_principle: '益气固表，抗过敏，避免接触过敏原', key_advice: '多食黄芪、大枣、山药；避免海鲜、芒果、菠萝等易过敏食物' },
        };
        return infoMap[constitution] || { name: constitution, note: '未知体质' };
    }
    static getAdaptation(term, constitution) {
        const pools = constitutionCache.length ? constitutionCache : constitutions;
        constitutionCache = pools;
        return pools.find(p => p.constitution_type === constitution && p.solar_term === term) || null;
    }
    static getAllTypes() {
        return ['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质'];
    }
    static getQuestionnaire() {
        return { questions: questionnaire.questions || [], constitution_info: questionnaire.constitution_info || {} };
    }
    static assess(userId, answers) {
        const questions = questionnaire.questions || [];
        if (!answers || !Array.isArray(answers) || answers.length !== 8) {
            return { error: '答案不完整，需要8题答案', constitution: '平和质' };
        }
        const constitutionScores = {
            '平和质': 0, '气虚质': 0, '阳虚质': 0, '阴虚质': 0,
            '痰湿质': 0, '湿热质': 0, '血瘀质': 0, '气郁质': 0, '特禀质': 0,
        };
        for (let i = 0; i < answers.length; i++) {
            const question = questions[i];
            if (!question)
                continue;
            const isYes = answers[i] === true || answers[i] === 1 || answers[i] === 'yes';
            if (isYes && question.target_constitutions) {
                for (const [constitution, score] of Object.entries(question.target_constitutions)) {
                    if (constitutionScores.hasOwnProperty(constitution)) {
                        constitutionScores[constitution] += Number(score);
                    }
                }
            }
        }
        const nonPingHeScores = {};
        for (const [type, score] of Object.entries(constitutionScores)) {
            if (type !== '平和质')
                nonPingHeScores[type] = score;
        }
        const sortedScores = Object.entries(nonPingHeScores).filter(([_, score]) => score > 0).sort((a, b) => b[1] - a[1]);
        let resultType, confidence;
        if (sortedScores.length === 0) {
            resultType = '平和质';
            confidence = 'high';
        }
        else if (sortedScores.length === 1) {
            resultType = sortedScores[0][0];
            confidence = sortedScores[0][1] >= 3 ? 'high' : 'medium';
        }
        else {
            resultType = sortedScores[0][0];
            confidence = sortedScores[0][1] >= 3 ? 'medium' : 'low';
        }
        const info = this.getBaseConstitutionInfo(resultType);
        return { constitution: resultType, confidence, scores: constitutionScores, ...info };
    }
    static getUserConstitution(userId) { return null; }
    static getAssessmentHistory(userId) { return []; }
    static clearHistory(userId) { }
}
export default ConstitutionService;
