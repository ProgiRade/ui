import { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Navbar } from "../components"
import { Button } from "primereact/button"
import { FaGamepad } from "react-icons/fa"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Competition } from "../Models"
import { Calendar } from "primereact/calendar"
import { 
    createVirtualCompetition,
    getAllCompetitions,
    getRandomVirtualCompetition,
    getAllVirtualCompetitions,
} from "../services/competition.service"
import { ProgressSpinner } from "primereact/progressspinner"
import { FaPlayCircle, FaTrophy } from "react-icons/fa";
import "./AdminHomePage.css"
import { Nullable } from "primereact/ts-helpers"

interface CompetitionDate {
    id: string,
    name: string,
    description: string,
    start_time: Date,
    end_time: Date,
    parent_id: string,
    problems: any[],
    trophies?: any[],
}

const ContestantHomePage = () => {
    const dateTimeOptions: any = {
        hour12: false,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }
    const units = ["minute", "hour", "day", "year"]
    const unitValues = [60, 60, 24, 365]
    const [date, setDate] = useState<Nullable<Date>>(new Date())
    const [loading, setLoading] = useState(true)
    const [competitions, setCompetitions] = useState<CompetitionDate[]>([])
    const [shownCompetitions, setShownCompetitions] = useState<CompetitionDate[]>([])
    const navigate = useNavigate()
    
    const fetchAllCompetitions = async () => {
        try {
            setLoading(true)
            const res = await getAllCompetitions()
            const competitions: CompetitionDate[] = res.data.map((item: Competition) => {
                return {
                    ...item,
                    start_time: new Date(item.start_time),
                    end_time: new Date(item.end_time),
                }
            })
            setCompetitions(competitions)
            setShownCompetitions(competitions.filter(item =>
                item.start_time < new Date() && item.end_time > new Date()
            ))
            setLoading(false)
        } catch (err: any) {
            console.log(err.response?.data?.detail ?? "Something went wrong")
        }
    }

    useEffect(() => {
        fetchAllCompetitions()
    }, [])

    const handleDateChange = (date:  Nullable<Date>) => {
        setDate(date)
        if (date) {
            setLoading(true)
            setShownCompetitions(competitions.filter(item => {
                const startDateZero = new Date(item.start_time)
                startDateZero.setHours(0, 0, 0, 0)
                const endDateZero = new Date(item.end_time)
                endDateZero.setHours(0, 0, 0, 0)
                if (startDateZero <= date && endDateZero >= date) {
                    return { item }
                }
            }))
            setLoading(false)
        }
    }
    
    const handleActiveCompetitions = () => {
        const date = new Date()
        setDate(date)
        setLoading(true)
        setShownCompetitions(competitions.filter(item => 
            item.start_time < date && item.end_time > date
        ))
        setLoading(false)
    }

    const handleCreateVirtualCompetition = async (parentCompetitionId: string) => {
        try {
            setLoading(true)
            const virtualCompetitions = await getAllVirtualCompetitions()
            const alreadyCreated = virtualCompetitions.data.find((item: Competition) => item.parent_id === parentCompetitionId)
            if (alreadyCreated) {
                console.log("Already created")
                navigate(`/contestant/virtual-competition/${alreadyCreated.id}`)
                setLoading(false)
                return
            }
            console.log("Creating virtual competition")
            const response = await createVirtualCompetition(parentCompetitionId)
            navigate(`/contestant/virtual-competition/${response.data}`)
            setLoading(false)
        } catch (err: any) {
            console.log(err.response?.data?.detail ?? "Something went wrong")
        }
    }
    
    const handleRandomVirtualCompetition = async () => {
        try {
            setLoading(true)
            const responseRandom = await getRandomVirtualCompetition()
            const response = await createVirtualCompetition(responseRandom.data.id)
            setLoading(false)
            navigate(`/contestant/virtual-competition/${response.data}`)
        } catch (err: any) {
            console.log(err.response?.data?.detail ?? "Something went wrong")
        }
    }

    const renderHeader = () => {
        return (
            <div className="flex justify-between p-2 text-primary">
                <p className="max-md:hidden text-2xl flex items-center">Available competitions</p>
                <div className="flex gap-4">
                    <Button
                        label="Active competitions"
                        className="shadow-darkgray drop-shadow-xl hover:scale-105
                        transition-all ease-in-out duration-300 bg-primary hover:bg-primarylight"
                        onClick={handleActiveCompetitions}
                    />
                    <Calendar
                        panelClassName="shadow-darkgray shadow-xl rounded-xl"
                        value={date}
                        onChange={(e) => {
                            e.value?.setHours(0, 0, 0, 0)
                            handleDateChange(e.value)
                        }}
                    />
                </div>
            </div>
        )
    }

    const renderProgressSpinner = () => {
        return loading ? (
            <div className="flex justify-center items-center h-56">
                <ProgressSpinner style={{ width: "50px", height: "50px" }} fill="#dee2e6" strokeWidth="7" />
            </div>
        ) : ( "No active competitions found." )
    }

    const AvailableForBodyTemplate = (rowData: CompetitionDate): React.ReactNode => {
        let duration = (rowData.end_time.getTime() - rowData.start_time.getTime()) / 1000
        let durationText = ""
        if (duration <= unitValues[0]) {
            durationText = `${Math.floor(duration)} s`
        } else {
            let unitIndex = 0
            while (duration >= unitValues[unitIndex] && unitIndex <= units.length - 1) {
                duration /= unitValues[unitIndex]
                unitIndex++
            }
            durationText = `${Math.floor(duration)} ${units[unitIndex - 1]}(s)`
        }
        const endDateString = rowData.end_time.toLocaleString("en-US", dateTimeOptions)
        const startDateString = rowData.start_time.toLocaleString("en-US", dateTimeOptions)
        return (
            <div className="min-w-[12rem]">
                <p className="font-semibold text-base">{durationText}</p>
                <p className="text-sm">expires: {endDateString}</p>
                <p className="text-sm">starts: {startDateString}</p>
            </div>
        )
    }

    const startBodyTemplate = (rowData: CompetitionDate): React.ReactNode => {
        const finished = rowData.end_time <= new Date()
        return (
            <div className="flex justify-center items-center">
                <Button
                    label={finished ? "Results" : "Start"}
                    disabled={rowData.start_time >= new Date()}
                    onClick={() => navigate(`/contestant/competition/${rowData.id}`)}
                    icon={finished ? null : <FaPlayCircle className="mr-1 transition-colors duration-150 ease-in-out" />}
                    className="py-2 px-3 text-lg text-primary hover:text-graymedium bg-graymedium hover:bg-primary transition-colors ease-in-out duration-150"
                />
            </div>
        )
    }

    const createVirtualCompetitionBodyTemplate = (rowData: CompetitionDate): React.ReactNode => {
        const showVirtualButton = rowData.end_time <= new Date()
        return (
            <div className="flex justify-center items-center">
                <Button
                    label="Virtual"
                    disabled={!showVirtualButton}
                    onClick={() => handleCreateVirtualCompetition(rowData.id)}
                    icon={<FaTrophy className="mr-1 transition-colors duration-150 ease-in-out" />}
                    className="py-2 px-3 text-lg text-primary hover:text-graymedium bg-graymedium hover:bg-primary transition-colors ease-in-out duration-150"
                />
            </div>
        )
    }

    return (
        <div className="bg-form bg-cover min-h-screen">
            <Navbar />
            <div className="grow p-[5%] flex flex-col gap-y-20">                
                <DataTable
                    value={shownCompetitions}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                    currentPageReportTemplate="{first} to {last} of {totalRecords}"
                    size={"small"}
                    emptyMessage={renderProgressSpinner}
                    stripedRows
                    showGridlines={true}
                    sortField="endTime" 
                    sortOrder={1}
                    header={renderHeader}
                    scrollable scrollHeight="100%"
                    paginatorClassName="rounded-b-xl"
                    pt={{
                        root: { className: "border-graydark border-2 rounded-xl shadow-xl shadow-darkgray" },
                        header: { className: "rounded-t-xl" },
                    }}
                    className="text-sm">
                    <Column 
                        field="name"
                        header="Name"
                        bodyClassName="overflow-y-auto max-sm:min-w-[50vw]"
                    />
                    <Column 
                        field="description" 
                        header="Description"
                        bodyClassName="overflow-y-auto max-sm:min-w-[50vw]"
                    />
                    <Column
                        header="Available for"
                        body={AvailableForBodyTemplate}
                    />
                    <Column
                        header="problems"
                        bodyClassName="text-center text-xl font-semibold"
                        body={(rowData: any) => rowData.problems.length}
                    />
                    <Column
                        header="Go!"
                        body={startBodyTemplate}
                    />
                    <Column
                        header="Create virutal competition"
                        body={createVirtualCompetitionBodyTemplate}
                    />
                </DataTable>
                <div className="flex flex-col gap-10 items-center bg-graymedium py-8 w-fit place-self-center 2xl:py-16 px-16 2xl:px-24 rounded-xl 2xl:rounded-3xl border-graydark border-b-4 drop-shadow-xl">
                    <div className="flex flex-col md:flex-row gap-5 items-center">
                        <p className="text-sm lg:text-2xl">Practice published tasks in</p>
                        <Button
                            label="Playground"
                            icon={<FaGamepad className="text-sm lg:text-3xl" />}
                            className="shadow-darkgray drop-shadow-xl hover:scale-105 flex gap-2 text-sm lg:text-2xl
                            transition-all ease-in-out duration-300 bg-primary hover:bg-primarylight"
                            onClick={() => navigate("/contestant/playground")}
                        />
                    </div>
                    <div className="flex flex-col md:flex-row gap-5 items-center text-center">
                        <p className="text-sm lg:text-2xl">Create private</p>
                        <Button
                            label="Virtual competition"
                            icon={<FaTrophy className="text-sm lg:text-2xl" />}
                            className="shadow-darkgray drop-shadow-xl hover:scale-105 flex gap-2 text-sm lg:text-2xl
                            transition-all ease-in-out duration-300 bg-primary hover:bg-primarylight"
                            onClick={handleRandomVirtualCompetition}
                        />
                        <p className="text-sm lg:text-2xl">automatically with random problems</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ContestantHomePage
