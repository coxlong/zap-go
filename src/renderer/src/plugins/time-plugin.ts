import { BasePlugin, ExecutionResult } from './types'

export class TimePlugin extends BasePlugin {
  constructor() {
    super({
      triggers: ['time', '时间'],
      name: '时间查询',
      description: '获取当前时间和日期',
      params: [
        {
          name: '格式',
          required: false,
          suggestions: ['详细', '简短', '时间戳'],
          description: '时间显示格式'
        }
      ],
      icon: '⏰'
    })
  }

  async execute(input: string): Promise<ExecutionResult> {
    const parsed = this.parseInput(input)
    const now = new Date()
    const format = parsed.params['格式'] || '详细'
    let timeString: string

    switch (format) {
      case '简短':
        timeString = now.toLocaleTimeString('zh-CN')
        break
      case '时间戳':
        timeString = `Unix时间戳: ${Math.floor(now.getTime() / 1000)}`
        break
      default:
        timeString = now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'long'
        })
    }

    return {
      icon: '⏰',
      title: '当前时间',
      content: timeString
    }
  }
}

// TODO: 其他可以实现的插件示例
// export class CalculatorPlugin extends BasePlugin
// export class WeatherPlugin extends BasePlugin
// export class TranslatePlugin extends BasePlugin
// export class FileSearchPlugin extends BasePlugin
