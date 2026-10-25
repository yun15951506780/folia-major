// src/components/modal/settings/AndroidAiSettingsSubview.tsx
// 安卓壳内的 AI 直连设置：用户自配 Gemini / OpenAI 兼容接口的 key（存本机
// localStorage），AI 主题生成从设备直连模型商，无需任何服务端。字段与桌面版的
// AI 设置一一对应；桌面专属项（更新通道、Discord、任务栏等）在这里不出现。
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Globe, KeyRound } from 'lucide-react';
import {
    loadAiDirectSettings,
    saveAiDirectSettings,
} from '../../../services/aiDirectClient';

interface AndroidAiSettingsSubviewProps {
    settingsCardClass: string;
    successTextColor: string;
}

const AndroidAiSettingsSubview: React.FC<AndroidAiSettingsSubviewProps> = ({
    settingsCardClass,
    successTextColor,
}) => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<typeof loadAiDirectSettings extends () => infer T ? T : never>(loadAiDirectSettings);
    const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

    const update = (patch: Partial<typeof settings>) => {
        setSettings(prev => ({ ...prev, ...patch }));
        setSaveState('idle');
    };

    const persist = () => {
        saveAiDirectSettings(settings);
        setSaveState('saved');
    };

    return (
        <div className="space-y-4">
            <div className={`rounded-2xl border p-5 ${settingsCardClass}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            {t('options.aiThemeGeneration') || 'AI 主题生成'}
                        </div>
                        <div className="mt-1 text-xs opacity-60" style={{ color: 'var(--text-secondary)' }}>
                            {t('options.aiThemeGenerationDesc') || '在设备上直接调用模型商接口生成主题，密钥只保存在本机。'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={persist}
                        className="min-h-9 shrink-0 rounded-xl border border-white/10 px-4 text-xs font-bold active:scale-95"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {saveState === 'saved'
                            ? (t('status.saved') || '已保存')
                            : (t('ui.save') || '保存')}
                    </button>
                </div>
                {saveState === 'saved' && (
                    <div className="mb-3 text-xs font-bold" style={{ color: successTextColor }}>
                        {t('status.saved') || '已保存'}
                    </div>
                )}

                <div className="mb-4 flex gap-2 rounded-2xl bg-black/10 p-1.5 dark:bg-white/5">
                    {(['gemini', 'openai'] as const).map(provider => (
                        <button
                            key={provider}
                            type="button"
                            onClick={() => update({ provider })}
                            className={`flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                                settings.provider === provider
                                    ? 'bg-zinc-500/30'
                                    : 'opacity-60'
                            }`}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {provider === 'gemini' ? 'Google Gemini' : t('options.otherCompatibleApi') || 'OpenAI 兼容'}
                        </button>
                    ))}
                </div>

                {settings.provider !== 'openai' ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <KeyRound size={14} className="opacity-60" />
                            <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {t('options.geminiApiKey') || 'Gemini API Key'}
                            </label>
                        </div>
                        <input
                            type="password"
                            value={settings.geminiApiKey}
                            onChange={e => update({ geminiApiKey: e.target.value })}
                            placeholder="AI Theme Generation Key"
                            className="w-full rounded-xl border border-white/10 bg-black/10 px-3.5 py-2.5 text-sm leading-normal transition-all focus:border-zinc-500 focus:outline-none dark:bg-white/5"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Globe size={14} className="opacity-60" />
                                <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {t('options.openaiApiUrl') || 'OpenAI API URL'}
                                </label>
                            </div>
                            <input
                                type="text"
                                value={settings.openaiApiUrl}
                                onChange={e => update({ openaiApiUrl: e.target.value })}
                                placeholder="https://api.openai.com/v1 or https://api.deepseek.com"
                                className="w-full rounded-xl border border-white/10 bg-black/10 px-3.5 py-2.5 text-sm leading-normal transition-all focus:border-zinc-500 focus:outline-none dark:bg-white/5"
                                style={{ color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Cpu size={14} className="opacity-60" />
                                <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {t('options.openaiApiModel') || 'OpenAI Model'}
                                </label>
                            </div>
                            <input
                                type="text"
                                value={settings.openaiModel}
                                onChange={e => update({ openaiModel: e.target.value })}
                                placeholder="gpt-5.6-luna / deepseek-v4-flash"
                                className="w-full rounded-xl border border-white/10 bg-black/10 px-3.5 py-2.5 text-sm leading-normal transition-all focus:border-zinc-500 focus:outline-none dark:bg-white/5"
                                style={{ color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {t('options.openaiApiTemperature') || 'Temperature'}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="2"
                                step="0.1"
                                value={settings.openaiTemperature}
                                onChange={e => update({ openaiTemperature: e.target.value })}
                                placeholder="0.7"
                                className="w-full rounded-xl border border-white/10 bg-black/10 px-3.5 py-2.5 text-sm leading-normal transition-all focus:border-zinc-500 focus:outline-none dark:bg-white/5"
                                style={{ color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <KeyRound size={14} className="opacity-60" />
                                <label className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {t('options.openaiApiKey') || 'OpenAI API Key'}
                                </label>
                            </div>
                            <input
                                type="password"
                                value={settings.openaiApiKey}
                                onChange={e => update({ openaiApiKey: e.target.value })}
                                placeholder="sk-..."
                                className="w-full rounded-xl border border-white/10 bg-black/10 px-3.5 py-2.5 text-sm leading-normal transition-all focus:border-zinc-500 focus:outline-none dark:bg-white/5"
                                style={{ color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AndroidAiSettingsSubview;
