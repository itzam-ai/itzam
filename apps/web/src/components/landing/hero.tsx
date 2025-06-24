import { motion } from "framer-motion";
import { ArrowRight, ArrowUp, Bird } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { useEffect, useState } from "react";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { Button } from "../ui/button";
import { CodeBlockCode } from "../ui/code-block";
import { Input } from "../ui/input";
import { TextLoop } from "../ui/text-loop";

interface StarBorderProps {
	as?: React.ElementType;
	className?: string;
	color?: string;
	speed?: string;
	thickness?: number;
	children: React.ReactNode;
	[key: string]: any; // Allow any additional props to be passed through
}

const StarBorder = ({
	as: Component = "button",
	className = "",
	color = "white",
	speed = "6s",
	thickness = 1,
	children,
	...rest
}: StarBorderProps) => {
	return (
		<Component
			className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
			style={{
				padding: `${thickness}px 0`,
				...rest.style,
			}}
			{...rest}
		>
			<div
				className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
				style={{
					background: `radial-gradient(circle, ${color}, transparent 10%)`,
					animationDuration: speed,
				}}
			></div>
			<div
				className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
				style={{
					background: `radial-gradient(circle, ${color}, transparent 10%)`,
					animationDuration: speed,
				}}
			></div>
			<div className="relative z-[1] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-stone-900 dark:to-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-center text-xs py-2 px-4 rounded-[20px]">
				{children}
			</div>
		</Component>
	);
};

const heroModels = [
	{
		icon: <ModelIcon tag="anthropic:claude-3-7-sonnet" size="lg" />,
		name: <p className="text-[#D97757]">Claude</p>,
	},
	{
		icon: <ModelIcon tag="openai:gpt-4o" size="lg" />,
		name: <p className="text-foreground">GPT</p>,
	},
	{
		icon: <ModelIcon tag="google:gemini-2.0-flash" size="lg" />,
		name: (
			<p className="bg-gradient-to-tr from-[#1C7DFF] via-[#1C69FF] to-[#F0DCD6] via-50% text-transparent bg-clip-text">
				Gemini
			</p>
		),
	},
	{
		icon: <ModelIcon tag="xai:grok-2-vision-1212" size="lg" />,
		name: <p className="text-foreground">Grok</p>,
	},
	{
		icon: <ModelIcon tag="mistral:mistral-large-latest" size="lg" />,
		name: (
			<p className="bg-gradient-to-b from-[#F7D046] via-[#EE792F] to-[#EA3326] via-50% text-transparent bg-clip-text">
				Mistral
			</p>
		),
	},
	{
		icon: <ModelIcon tag="deepseek:deepseek-chat" size="lg" />,
		name: <p className="text-[#4D6BFE]">DeepSeek</p>,
	},
	{
		icon: <ModelIcon tag="cohere:command-r-plus" size="lg" />,
		name: <p className="text-[#39594D]">Command</p>,
	},
];

const heroModelsMobile = [
	{
		icon: <ModelIcon tag="anthropic:claude-3-7-sonnet" size="md" />,
		name: <p className="text-[#D97757]">Claude</p>,
	},
	{
		icon: <ModelIcon tag="openai:gpt-4o" size="md" />,
		name: <p className="text-foreground">GPT</p>,
	},
	{
		icon: <ModelIcon tag="google:gemini-2.0-flash" size="md" />,
		name: (
			<p className="bg-gradient-to-tr from-[#1C7DFF] via-[#1C69FF] to-[#F0DCD6] via-50% text-transparent bg-clip-text">
				Gemini
			</p>
		),
	},
	{
		icon: <ModelIcon tag="xai:grok-2-vision-1212" size="md" />,
		name: <p className="text-foreground">Grok</p>,
	},
	{
		icon: <ModelIcon tag="mistral:mistral-large-latest" size="md" />,
		name: (
			<p className="bg-gradient-to-b from-[#F7D046] via-[#EE792F] to-[#EA3326] via-50% text-transparent bg-clip-text">
				Mistral
			</p>
		),
	},
	{
		icon: <ModelIcon tag="deepseek:deepseek-chat" size="md" />,
		name: <p className="text-[#4D6BFE]">DeepSeek</p>,
	},
	{
		icon: <ModelIcon tag="cohere:command-r-plus" size="md" />,
		name: <p className="text-[#39594D]">Command</p>,
	},
];

export function Hero() {
	const { isSignedIn } = useCurrentUser();

	return (
		<section className="mx-auto max-w-5xl min-h-screen py-24 md:pt-32 pt-48 flex justify-center align-middle flex-col">
			<div className="flex justify-center align-middle max-w-5xl mx-4 md:mx-0 flex-col md:flex-row md:gap-0 gap-24">
				<div className="w-full md:w-1/2 flex flex-col justify-center align-middle text-left">
					<motion.div
						initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
						animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
						transition={{ duration: 0.5 }}
						className="mb-4"
					>
						<StarBorder
							as={Link}
							href="https://x.com/grimcodes/status/1937442615479472385"
							target="_blank"
							rel="noopener noreferrer"
							color="#f97316"
							speed="2s"
							thickness={1}
							className="text-xs"
						>
							Backed by{" "}
							<span className="bg-orange-500 size-4 text-white inline-block">
								G
							</span>{" "}
							Combinator
						</StarBorder>
					</motion.div>
					<motion.h1
						initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
						animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="font-medium text-3xl md:text-5xl"
					>
						Integrate
						<TextLoop
							className="text-primary ml-4 hidden md:inline-flex"
							transition={{ duration: 0.3 }}
							interval={3.5}
						>
							{heroModels.map((model, index) => (
								<span className="flex items-center gap-2.5" key={index}>
									{model.icon}
									{model.name}
								</span>
							))}
						</TextLoop>
						<TextLoop
							className="text-primary ml-3 inline-flex md:hidden"
							transition={{ duration: 0.3 }}
							interval={3.5}
						>
							{heroModelsMobile.map((model, index) => (
								<span className="flex items-center gap-1.5 h-8" key={index}>
									{model.icon}
									{model.name}
								</span>
							))}
						</TextLoop>
					</motion.h1>
					<motion.h1
						initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
						animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="font-medium text-3xl md:text-5xl md:mt-2 mt-1 flex items-center gap-1 justify-start"
					>
						in 2 minutes
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
						animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
						className="max-w-2xl text-sm md:text-lg text-muted-foreground md:mt-6 mt-4"
					>
						Stop wasting time on <span className="text-primary/50">RAG</span>,{" "}
						<span className="text-primary/50">prompts</span>, and{" "}
						<span className="text-primary/50">models</span>.
						<br />
						Manage everything about AI in one place.
					</motion.p>
					<motion.div
						initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
						animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
						transition={{ duration: 0.5, delay: 0.5 }}
						className="mt-8 flex gap-x-4 justify-center md:justify-start"
					>
						{isSignedIn ? (
							<Link href="/dashboard">
								<Button variant="primary" className="w-40">
									Start Building
									<ArrowRight className="size-4" />
								</Button>
							</Link>
						) : (
							<Link href="/auth/login" prefetch={true}>
								<Button variant="primary" className="w-40">
									Start Building
									<ArrowRight className="size-4" />
								</Button>
							</Link>
						)}
						<Link href="https://docs.itz.am" target="_blank">
							<Button variant="ghost">Check the docs</Button>
						</Link>
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
					animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
					transition={{ duration: 0.5, delay: 0.9 }}
					className="md:w-1/2 w-full flex justify-end"
				>
					<Showcase />
				</motion.div>
			</div>
		</section>
	);
}

const firstAssistantMessage = "Hey 😃, I'm Acme's support agent! Need help?";
const firstUserMessage = "I forgot my password and I can't log in.";
const secondAssistantMessage =
	"Got it, let me help you! I sent a verification code to your email (paulg@yc.com).";

export function Showcase() {
	const [userInput, setUserInput] = useState("");

	const code = `
const response = await itzam.streamText({
  input: "${userInput}",
  workflowSlug: "support-chat"
});
  `;

	const { resolvedTheme } = useTheme();

	const [firstUserMessageTyped, setFirstUserMessageTyped] = useState("");
	const [secondAssistantMessageTyped, setSecondAssistantMessageTyped] =
		useState("");

	useEffect(() => {
		simulateTyping(firstUserMessage, 4000, setFirstUserMessageTyped, 40);

		simulateTyping(firstUserMessage, 6000, setUserInput, 30);

		simulateTyping(
			secondAssistantMessage,
			8000,
			setSecondAssistantMessageTyped,
			30,
		);
	}, []);

	return (
		<div className="w-full md:max-w-lg max-w-full ">
			<div className="mx-auto">
				<div className="p-4 dark:bg-card bg-card/70 rounded-t-3xl border md:mx-10 mx-4 border-b-0 shadow-sm">
					<div className="p-2">
						<h2 className="font-medium text-center flex items-center gap-1.5 justify-center">
							<Bird className="size-3.5 mb-0.5" strokeWidth={2.2} />
							Acme Support
						</h2>

						<div className="mt-6 flex flex-col gap-4 min-h-[200px] overflow-y-auto">
							<Message role="assistant" isTyping={false} delay={1.4}>
								<p>{firstAssistantMessage}</p>
							</Message>
							{firstUserMessageTyped && (
								<Message role="user" isTyping={false} delay={0.1}>
									<p>{firstUserMessageTyped}</p>
								</Message>
							)}
							{secondAssistantMessageTyped && (
								<Message role="assistant" isTyping={false} delay={0.1}>
									<p>{secondAssistantMessageTyped}</p>
								</Message>
							)}
						</div>

						<div className="relative mt-6">
							<Input
								placeholder="Send a message..."
								className="w-full pr-8 pl-4 h-10 rounded-full"
							/>
							<Button
								variant="outline"
								className="rounded-full bg-muted-foreground/50 border-none p-2 size-6 absolute right-2.5 top-1/2 -translate-y-1/2 hover:bg-muted-foreground/60"
							>
								<ArrowUp className="size-3 text-primary" strokeWidth={2.5} />
							</Button>
						</div>
					</div>
				</div>

				<div className="border rounded-3xl dark:bg-muted/50 bg-card p-2 shadow-sm">
					<CodeBlockCode
						code={code}
						language="typescript"
						theme={resolvedTheme === "dark" ? "vesper" : "github-light"}
					/>
				</div>
			</div>
		</div>
	);
}

function Message({
	role,
	children,
	isTyping,
	delay,
}: {
	role: string;
	children: React.ReactNode;
	isTyping: boolean;
	delay: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
			animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
			transition={{ duration: 0.2, delay }}
			className={`flex items-center gap-2 ${
				role === "user" ? "justify-end items-end" : "justify-start items-start"
			}`}
		>
			{isTyping ? (
				<div
					className={`rounded-full text-sm px-4 py-2 max-w-[80%] flex items-start gap-2 ${
						role === "user" ? "bg-muted" : ""
					}`}
				>
					<div className="rounded-full bg-foreground/10 p-1">
						<Bird className="size-2.5" />
					</div>
					<div className="flex gap-1 items-center mt-2">
						<div className="size-2 bg-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
						<div className="size-2 bg-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
						<div className="size-2 bg-muted rounded-full animate-bounce" />
					</div>
				</div>
			) : (
				<div
					className={`rounded-full text-sm py-2 max-w-[80%] flex items-start gap-2 ${
						role === "user" ? "bg-muted px-4" : "md:px-4 px-2"
					}`}
				>
					{role === "assistant" && (
						<div className="rounded-full bg-foreground/10 p-1 mt-0.5">
							<Bird className="size-2.5" />
						</div>
					)}
					{children}
				</div>
			)}
		</motion.div>
	);
}

export function simulateTyping(
	text: string,
	delay: number,
	setText: (text: string) => void,
	speed?: number,
	setIsTyping?: (isTyping: boolean) => void,
	onFinish?: () => void,
) {
	let currentIndex = 0;

	const typeNextChar = () => {
		if (currentIndex < text.length) {
			if (currentIndex === 0) {
				setIsTyping?.(true);
			}

			setText(text.slice(0, currentIndex + 1));
			currentIndex++;

			// Random typing speed between 50ms and 150ms for natural feel
			const typingSpeed = speed || Math.random() * 100;
			setTimeout(typeNextChar, typingSpeed);
		} else {
			setIsTyping?.(false);
			onFinish?.();
		}
	};

	setTimeout(typeNextChar, delay);
}
