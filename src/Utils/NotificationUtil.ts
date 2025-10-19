import task, { Task } from "tasuku"
import { AsyncLocalStorage } from "node:async_hooks"

import { InnerActionCallback, TaskCallback, TaskConfig } from "@/Protocols/NotificationProtocol"

import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"

class NotificationUtil {
	private readonly taskContextStorage = new AsyncLocalStorage<{ currentTask?: Task, taskConfig?: TaskConfig }>()

	async runTask<Result>(title: string, callbackFn: TaskCallback<Result>): Promise<Result | undefined> {
		try {
			const taskContextStorage = this.taskContextStorage.getStore()
			const taskFn = taskContextStorage?.currentTask || task

			const runner = await taskFn(title, async (taskConfig) => (
				this.taskContextStorage.run({ currentTask: taskConfig.task, taskConfig }, async () => {
					try {
						const result = await callbackFn(taskConfig)
						taskConfig.setStatus("")
						return result
					} catch (error) {
						const typedError = error as Error

						ErrorHandlerUtil.handle(typedError)
						taskConfig.setError(typedError)
					}
				})
			))

			return runner.result as Result
		} catch (error) {
			ErrorHandlerUtil.handle(error)
		}
	}

	async runInnerAction<Result>(title: string, callbackFn: InnerActionCallback<Result>): Promise<Result> {
		const taskContextStorage = this.taskContextStorage.getStore()

		taskContextStorage?.taskConfig?.setStatus(title)
		return await callbackFn()
	}
}

export default new NotificationUtil()