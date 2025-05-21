"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="container py-8">
			<Alert variant="destructive" className="mb-6">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>
					{error.message || "Something went wrong while loading the dashboard."}
				</AlertDescription>
			</Alert>

			<div className="flex justify-center">
				<Button onClick={reset} variant="outline">
					Try again
				</Button>
			</div>
		</div>
	);
}
