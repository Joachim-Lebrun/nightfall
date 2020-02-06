import { Component, OnInit} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import UserService from '../../services/user.service';
import { UtilService } from '../../services/utils/util.service';
import { Router } from '@angular/router';

/**
 *  Spend fungible token component, which is used for rendering the page of transfer ERC-20 token to the selected receipent.
 */
@Component({
  selector: 'app-admin',
  templateUrl: './index.html',
  providers: [UserService, UtilService],
  styleUrls: ['./index.css']
})
export default class AdminComponent implements OnInit {
  /**
   * Flag for http request
   */
  isRequesting = false;

  /**
   * To store all users
   */
  users: any = [];

  /**
   * To store transaction hash 
   */
  transactionHash;
  /**
   * retrieved decrypted data for the transaction
   */
  decryptedData: any;

  constructor(
    private toastr: ToastrService,
    private userService: UserService,
    private utilService: UtilService,
    private router: Router
  ) {

  }

  ngOnInit () {
    this.verifyAdminAccount();
  }

  /**
   * Method to verfiy admin user
   */
  verifyAdminAccount() {
    this.isRequesting = true;
      this.userService.getUserDetails().subscribe(
        data => {
          if(data['data'].name === 'admin'){
            this.getAllRegisteredNames();
          }else{
            this.router.navigate(['/overview']);
          }
          this.isRequesting = false;
      }, error => {
        this.isRequesting = false;

      });
  }

  /**
   * Method to retrive all users.
   *
   */
  getAllRegisteredNames() {
    this.isRequesting = true;
    this.userService.getAllRegisteredNames().subscribe(
      data => {
        this.isRequesting = false;
        this.users = data['data'];
      }, error => {
        this.isRequesting = false;
        this.toastr.error('Please try again.', 'Error');
      });
  }

  /**
   * Method to block or unblock user
   */
  userActions() {
    this.isRequesting = true;

    this.isRequesting = false;
  }

  /**
   * Method to decrypt the transaction details
   */
  decryptTransaction() {
    this.isRequesting = true;
    this.decryptedData = JSON.stringify({name:'vishnu'});
    this.isRequesting = false;
  }
}
