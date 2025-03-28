module.exports = (() => {
    const userMethods = require('../apiMethods/reportMethods');
   
    return {
        userCreate: (req, res) => userMethods.createUser(req, res),
        getDetails: (req, res) => userMethods.getUserDetails(req, res),
        updateUser: (req, res) => userMethods.updateUser(req, res),
        submitApproval: (req, res) => userMethods.submitApproval(req, res),
        listOfApproval: (req, res) => userMethods.approvalList(req, res),
        invoiceCreation:(req,res)=>userMethods.submitInvoice(req, res),
        countryList: (req, res) => userMethods.countryList(req, res),
        stateList: (req, res) => userMethods.stateList(req, res),
        updateInvoice: (req, res) => userMethods.updateInvoice(req, res),
        getTotalInvoice:(req,res)=>userMethods.getTotalInvoice(req,res),
        invoiceLayout:(req,res)=>userMethods.invoiceLayoutSubmit(req,res),
        getInvoiceLayout:(req,res)=>userMethods.getAllInvoiceLayout(req,res),
        userCreationNew:(req,res)=>userMethods.userCreationSave(req,res),
        getAllUser:(req,res)=>userMethods.getAllUserLists(req,res),
        updateUserCreation:(req,res)=>userMethods.updateUserCreation(req,res),
        submitLogin:(req,res)=>userMethods.userLogin(req,res),
        approveOrReject:(req,res)=>userMethods.approvedOrRejected(req,res),
        InvoiceBasedOnDates:(req,res)=>userMethods.fetchInvoiceBasedOnDates(req,res),
        customerCreation:(req,res)=>userMethods.newCustomerCreation(req,res),
        customerUpdate:(req,res)=>userMethods.updateCustomer(req,res),
        getAllCustomer:(req,res)=>userMethods.listOfCustomers(req,res),
        forgot:(req,res)=>userMethods.forgotPassword(req,res),
        approveOrRejectMail: (req, res) => userMethods.approvedOrRejectedMail(req, res),
        chargesCreation:(req,res)=>userMethods.chargesSubmit(req,res),
        Updatecharges:(req,res)=>userMethods.UpdateSubmit(req,res),
        chargesList:(req,res)=>userMethods.listOfCharges(req,res),
        reviewed:(req,res)=>userMethods.reviewedInvoice(req,res),
        reset:(req,res)=>userMethods.resetPassword(req,res),
        notification:(req,res)=>userMethods.getNotification(req,res),
        verifyed:(req,res)=>userMethods.verifyedAndUpdated(req,res),
        deleteData:(req,res)=>userMethods.deleteGlobally(req,res),

    };
})();
