import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
  Badge,
  Avatar,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { ModalComponent } from "../../../component/modal";
import { PaginationComponent } from "../../../component/pagination";

type Raidboss = {
    pokemon_id: string,
    pokemon_name: string,
    pokemon_image: string,
    pokemon_tier: number,
    start_date: string,
    end_date: string,
    created_at: string,
};

function Raidboss() {

    const [raid_boss, setRaid_boss] = useState<Raidboss[]>([]);

  return (
    <div>
      
    </div>
  )
}

export default Raidboss
