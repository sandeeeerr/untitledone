"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	placeholder?: string
	tags: string[]
	setTags: React.Dispatch<React.SetStateAction<string[]>>
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
	const { placeholder, tags, setTags, className, ...rest } = props

	const [inputValue, setInputValue] = React.useState("")
	const inputRef = React.useRef<HTMLInputElement>(null)

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value)
	}

	const commitNewTag = () => {
		const newTag = inputValue.trim()
		if (newTag && !tags.includes(newTag)) {
			setTags([...tags, newTag])
		}
		setInputValue("")
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "," || e.key === "Enter") {
			e.preventDefault()
			commitNewTag()
			return
		}
		if (e.key === "Tab") {
			if (inputValue.trim().length > 0) {
				commitNewTag()
			}
			return
		}
		if (e.key === "Backspace" && inputValue.length === 0 && tags.length > 0) {
			// Backspace on empty input removes last tag
			setTags(tags.slice(0, -1))
		}
	}

	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove))
	}

	return (
		<div>
			<div className={cn("flex flex-wrap gap-2 rounded-md", tags.length !== 0 && "mb-3")}> 
				{tags.map((tag, index) => (
					<span key={index} className="transition-all border bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-8 items-center text-sm pl-2 rounded-md">
						{tag}
						<Button
							type="button"
							variant="ghost"
							onClick={() => removeTag(tag)}
							className={cn("py-1 px-3 h-full hover:bg-transparent")}
						>
							<X size={14} />
						</Button>
					</span>
				))}
			</div>
			<div className="flex items-center gap-2">
				<Input
					ref={(node) => {
						// keep local ref and forward ref
						;(inputRef as any).current = node
						if (typeof ref === "function") ref(node)
						else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
					}}
					type="text"
					placeholder={placeholder}
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onBlur={() => {
						if (inputValue.trim().length > 0) commitNewTag()
					}}
					className={className}
					{...rest}
				/>
				<Button type="button" variant="secondary" size="sm" onClick={commitNewTag} aria-label="Add tag">
					<Plus className="h-4 w-4" />
				</Button>
			</div>
		</div>
	)
})

TagInput.displayName = "TagInput"


