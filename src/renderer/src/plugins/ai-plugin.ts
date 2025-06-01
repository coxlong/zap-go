import { BasePlugin, ExecutionResult } from './types'

export class AIPlugin extends BasePlugin {
  constructor() {
    super({
      triggers: ['ai', '问答', 'ask', '问'],
      name: 'AI助手',
      description: '与AI助手对话',
      params: [
        {
          name: '问题',
          required: true,
          description: '要询问的问题'
        }
      ],
      icon: '🤖'
    })
  }

  async execute(input: string): Promise<ExecutionResult> {
    const parsed = this.parseInput(input)
    const question = parsed.params['问题'] || input.split(' ').slice(1).join(' ')

    if (!question) {
      return {
        icon: '❓',
        title: 'AI助手',
        content: '请输入您的问题。例如：ai 今天天气怎么样？'
      }
    }

    // 模拟AI回复
    return {
      icon: '🤖',
      title: 'AI助手回复',
      content: `您问的是："${question}"\n\n抱歉，这是一个模拟回复。实际的AI功能需要接入真实的AI服务。`
    }
  }
}
