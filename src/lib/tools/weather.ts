import type { ToolWithPrompt } from "../ai/adapters/types";

/**
 * WMO Weather interpretation codes mapped to Japanese descriptions
 * @see https://open-meteo.com/en/docs#weathervariables
 */
export const WEATHER_CODE_MAP: Record<number, string> = {
	0: "快晴",
	1: "ほぼ晴れ",
	2: "一部曇り",
	3: "曇り",
	45: "霧",
	48: "着氷性霧",
	51: "弱い霧雨",
	53: "霧雨",
	55: "強い霧雨",
	56: "弱い着氷性霧雨",
	57: "強い着氷性霧雨",
	61: "弱い雨",
	63: "雨",
	65: "強い雨",
	66: "弱い着氷性の雨",
	67: "強い着氷性の雨",
	71: "弱い雪",
	73: "雪",
	75: "強い雪",
	77: "霧雪",
	80: "弱いにわか雨",
	81: "にわか雨",
	82: "激しいにわか雨",
	85: "弱いにわか雪",
	86: "強いにわか雪",
	95: "雷雨",
	96: "弱い雹を伴う雷雨",
	99: "強い雹を伴う雷雨",
};

type GeocodingResult = {
	name: string;
	latitude: number;
	longitude: number;
	country: string;
	timezone: string;
};

type GeocodingResponse = {
	results?: GeocodingResult[];
};

type WeatherResponse = {
	current: {
		temperature_2m: number;
		weather_code: number;
		relative_humidity_2m: number;
		wind_speed_10m: number;
	};
	timezone: string;
};

type WeatherResult = {
	success: boolean;
	error?: string;
	data?: {
		cityName: string;
		country: string;
		temperature: number;
		condition: string;
		humidity: number;
		windSpeed: number;
		timezone: string;
	};
};

/**
 * Fetch coordinates for a city name using Open-Meteo Geocoding API
 */
async function getCoordinates(
	cityName: string,
): Promise<GeocodingResult | null> {
	const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=ja`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Geocoding API error: ${response.status}`);
	}

	const data = (await response.json()) as GeocodingResponse;
	return data.results?.[0] ?? null;
}

/**
 * Fetch current weather data using Open-Meteo Weather API
 */
async function getWeatherData(
	latitude: number,
	longitude: number,
): Promise<WeatherResponse> {
	const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Weather API error: ${response.status}`);
	}

	return (await response.json()) as WeatherResponse;
}

/**
 * Get weather condition description from WMO code
 */
function getWeatherCondition(code: number): string {
	return WEATHER_CODE_MAP[code] ?? "不明";
}

/**
 * Create the weather tool for use with @cloudflare/ai-utils
 */
export function createWeatherTool(): ToolWithPrompt {
	return {
		name: "getWeather",
		description:
			"Returns the current weather for a specified city. Use this when the user asks about weather conditions, temperature, humidity, wind speed, or climate for a specific location.",
		parameters: {
			type: "object",
			properties: {
				cityName: {
					type: "string",
					description:
						"The name of the city to get weather for (e.g., 'Tokyo', '東京', 'Paris', 'New York')",
				},
			},
			required: ["cityName"],
		},
		promptInfo: {
			description:
				"Returns the current weather for a specified city including temperature, conditions, humidity, and wind speed. Requires a cityName parameter.",
			whenToUse: [
				'User asks about weather in a specific city (e.g., "東京の天気は？", "What\'s the weather in Tokyo?", "大阪は今何度？")',
			],
			examples: [
				{
					userQuery: "東京の天気は？",
					toolResponse:
						'{"success": true, "data": {"cityName": "東京", "country": "日本", "temperature": 18.5, "condition": "快晴", "humidity": 45, "windSpeed": 12.5, "timezone": "Asia/Tokyo"}}',
					goodResponse:
						"東京は今18.5℃で快晴だゾ！(´ω｀) 湿度45%で風速12.5km/hだから、お出かけ日和だねwww",
				},
			],
		},
		function: async (args: Record<string, unknown>): Promise<string> => {
			const cityName = args.cityName as string | undefined;

			if (!cityName || cityName.trim() === "") {
				const result: WeatherResult = {
					success: false,
					error: "都市名を入力してください",
				};
				return JSON.stringify(result);
			}

			try {
				const location = await getCoordinates(cityName.trim());

				if (!location) {
					const result: WeatherResult = {
						success: false,
						error: `指定された都市「${cityName}」が見つかりませんでした`,
					};
					return JSON.stringify(result);
				}

				const weather = await getWeatherData(
					location.latitude,
					location.longitude,
				);

				const result: WeatherResult = {
					success: true,
					data: {
						cityName: location.name,
						country: location.country,
						temperature: weather.current.temperature_2m,
						condition: getWeatherCondition(weather.current.weather_code),
						humidity: weather.current.relative_humidity_2m,
						windSpeed: weather.current.wind_speed_10m,
						timezone: weather.timezone,
					},
				};

				return JSON.stringify(result);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				const result: WeatherResult = {
					success: false,
					error: `天気情報の取得に失敗しました: ${errorMessage}`,
				};
				return JSON.stringify(result);
			}
		},
	};
}
