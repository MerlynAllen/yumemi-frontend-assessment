import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Legend, ResponsiveContainer } from "recharts";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const API_ENDPOINT = "https://yumemi-frontend-engineer-codecheck-api.vercel.app"
const X_API_KEY = "8FzX5qLmN3wRtKjH7vCyP9bGdEaU4sYpT6cMfZnJ";


const API_HEADER = {
    "Content-Type": "application/json",
    "X-API-Key": X_API_KEY,
}
interface PrefectureResponse {
    result: Prefecture[];
}

interface Prefecture {
    prefCode: number,
    prefName: string;
}

interface PopulationCompositionPerYearResponse {
    result: PopulationCompositionPerYear;
}

interface PopulationCompositionPerYear {
    boundaryYear: number;
    data: PopulationCompositionData[];
}

interface PopulationCompositionData {
    label: string;
    data: PopulationCompositionDataItem[];
}

interface PopulationCompositionDataItem {
    year: number;
    value: number;
    rate: number;
}


async function fetchPrefectures(): Promise<Prefecture[]> {
    const response = await fetch(`${API_ENDPOINT}/api/v1/prefectures`, {
        method: "GET",
        headers: API_HEADER,
    });

    if (!response.ok) {
        throw new Error("Error fetching prefectures");
    }
    const prefecture_response: PrefectureResponse = await response.json();
    return prefecture_response.result;
}

const populationDataCache: Map<number, PopulationCompositionPerYear> = new Map();

async function fetchPopulationCompositionPerYear(prefCode: number): Promise<PopulationCompositionPerYear> {
    if (populationDataCache.has(prefCode)) {

        return populationDataCache.get(prefCode)!;
    }
    const response = await fetch(`${API_ENDPOINT}/api/v1/population/composition/perYear?prefCode=${prefCode}`, {
        method: "GET",
        headers: API_HEADER,
    });
    if (!response.ok) {
        throw new Error("Error fetching population composition per year");
    }
    const population_response: PopulationCompositionPerYearResponse = await response.json();
    populationDataCache.set(prefCode, population_response.result);
    return population_response.result;
}



export default function Page() {
    const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
    const [selectedPrefData, setSelectedPrefData] = useState<Record<number, PopulationCompositionPerYear>>({});
    const [graphType, setGraphType] = useState<number>(0);
    const setPrefectureDetails = async (prefCode: number) => {
        try {
            if (selectedPrefData[prefCode]) {
                const updatedData = { ...selectedPrefData };
                delete updatedData[prefCode];
                setSelectedPrefData(updatedData);
            } else {
                const data = await fetchPopulationCompositionPerYear(prefCode);
                setSelectedPrefData({
                    ...selectedPrefData,
                    [prefCode]: data,
                });
            }
        } catch (error) {
            console.error("Error fetching population composition per year:", error);
        }
    }

    const changeGraphType = (graphType: number) => {
        setGraphType(graphType);
    }


    useEffect(() => {
        const loadPrefecturesData = async () => {
            try {
                const prefecturesData = await fetchPrefectures();
                console.log("Fetched prefectures:", prefecturesData);
                setPrefectures(prefecturesData);
                await setPrefectureDetails(prefecturesData[0].prefCode);
            }
            catch (error) {
                console.error("Error fetching prefectures:", error);
            }
        }
        loadPrefecturesData();
    }, []);





    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8">
            <h1 className={`${geistSans.className} ${geistMono.className} text-slate-600`}>都道府県別<GraphTypeSelect graphType={ graphType } changeGraphType={changeGraphType}></GraphTypeSelect>推移グラフ</h1>
            <ResponsiveContainer className={`max-w-2xl text-sm`} height={500}>
                <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="1 1" />
                    <XAxis dataKey="year" type="category" allowDuplicatedCategory={false} label={{ value: "年度", position: "insideBottomRight", offset: -3 }} />
                    <YAxis dataKey="value" label={{ value: "人数", position: "insideTopLeft" }} padding={{ top: 30 }} />

                    <Legend verticalAlign="top" height={40} iconType="circle" iconSize={11} />
                    {Object.entries(selectedPrefData).map(([prefCode, data],) => {
                        const prefecture = prefectures.find((pref) => pref.prefCode === Number(prefCode));

                        const displayData = data.data[graphType].data.filter((value) => {
                            if (value.year <= data.boundaryYear) return value
                        });

                        return (
                            <Line
                                key={prefCode}
                                type="monotone"
                                dataKey="value"
                                data={displayData}
                                name={prefecture?.prefName || `Prefecture ${prefCode}`}
                                stroke={`hsla(${Number(prefCode) * 47}, 70%, 40%, 60%)`}
                            />
                        );
                    })}
                </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center overflow-y-auto h-50 max-w-xl gap-2">
                {prefectures.map((prefecture) => (
                    <CheckBox
                        key={prefecture.prefCode}
                        prefName={prefecture.prefName}
                        onClickCallback={() => setPrefectureDetails(prefecture.prefCode)}
                        prefCode={prefecture.prefCode}
                        selectedPrefData={selectedPrefData}
                    />
                ))}
            </div>
        </div>
    )
}

interface CheckBoxProps {
    prefName: string;
    prefCode: number;
    selectedPrefData: Record<number, PopulationCompositionPerYear>;
    onClickCallback: () => void;

}

function CheckBox({ prefName, prefCode, selectedPrefData, onClickCallback }: CheckBoxProps) {
    const isChecked = !!selectedPrefData[prefCode];
    const handleClick = () => {
        onClickCallback();
    };
    return (
        <div
            className={`${geistSans.className} ${geistMono.className} inline-flex items-center justify-center rounded px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-500/10 ring-inset hover:bg-slate-600/10 transition duration-300 ease-in-out cursor-pointer`}
            onClick={handleClick}
            style={{
                backgroundColor: isChecked ? `hsla(${prefCode * 47}, 70%, 70%, 15%)` : "",
            }}
        >
            {prefName}
        </div>
    );
}


interface GraphTypeSelectProps {
    graphType: number;
    changeGraphType: (graphType: number) => void;
}

function GraphTypeSelect({ graphType, changeGraphType }: GraphTypeSelectProps) {
    return (
        <select className="bg-transparent placeholder:text-slate-400 text-slate-700 text-xs border border-slate-500/10 rounded px-1 py-1 m-2 transition duration-300 ease hover:border-slate-100 hover:bg-slate-100/50 appearance-auto cursor-pointer items-center justify-center text-center"
            onChange={(e) => changeGraphType(Number(e.target.value))}
            value={graphType}>
            <option value="0">総人口</option>
            <option value="1">年少人口</option>
            <option value="2">生産年齢人口</option>
            <option value="3">老年人口</option>
        </select>
    )
}