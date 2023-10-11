
import { Component, OnInit } from '@angular/core';
import { SharedService } from 'src/app/shared.service';


@Component({
  selector: 'app-show-emp',
  templateUrl: './show-emp.component.html',
  styleUrls: ['./show-emp.component.css']
})
export class ShowEmpComponent implements OnInit {

  constructor(private service:SharedService) { }

  EmployeeList:any = [];

  ModalTitle:string = "";
  ActivateAddEditEmpComp:boolean = false;
  emp:any;

  ngOnInit(): void {
    this.refreshEmpList();
  }

  addClick(){
    this.emp={
      EmployeeId:0,
      EmployeeName:"",
      Department:"",
      DateOfJoining:"",
      PhotoFileName:"anonymous.png",
      
    }
    this.ModalTitle="Add Employee";
    this.ActivateAddEditEmpComp=true;
    this.refreshEmpList();
  }

  closeClick(){
    this.ActivateAddEditEmpComp=false;
    this.refreshEmpList();
  }

  editClick(item: any){
    this.emp = item;
    this.emp.DateOfJoining=item.DateOfJoining.slice(0, 10);
    this.ModalTitle="Edit Employee";
    this.ActivateAddEditEmpComp=true;
    this.refreshEmpList();
  }

  deleteClick(item:any){
    if(confirm("Are you sure?")){
      this.service.deleteEmployee(item.EmployeeId).subscribe  (data=>{alert(data.toString());
        this.refreshEmpList();
      })
    }
  }


  refreshEmpList(){
    this.service.getEmpList().subscribe(data=>{
      this.EmployeeList = data.sort((a, b) => a.EmployeeId - b.EmployeeId);})
      
  }
}

