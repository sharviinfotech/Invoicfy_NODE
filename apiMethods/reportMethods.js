const axios = require('axios');
const { User, Approval, Counter, invoice, countries, statee, layout, invoiceproformaCount,
    invoicetaxCount, uniqueId, userCreation, userCount, customerCreation, customerCount, chargesCreation, chargesCount, companyCreate, companyCount } = require('../models/userCreationModel');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const moment = require('moment');
const nodemailer = require('nodemailer');
// const { sendInvoiceDataToEmail } = require('../fetchInvoiceFolder/sendInvoiceToMail'); // Import email function
const recevieInvoiceSendToMail = require('../fetchInvoiceFolder/intialmailsend')

module.exports = (() => {
    return {
        createUser: async (req, res) => {
            try {
                const { userName, firstName, lastName, email, password, confPassword, contact, plant, Design, function: userFunction } = req.body;

                // Ensure password and confPassword match
                if (password !== confPassword) {
                    return res.status(400).json({ error: "Passwords do not match" });
                }

                const newUser = new User({ // Use the correct model
                    userName,
                    firstName,
                    lastName,
                    email,
                    password,
                    confPassword,
                    contact,
                    plant,
                    Design,
                    function: userFunction,
                });

                // Save the user to the database
                const savedUser = await newUser.save();

                res.status(200).json({ responseData: { message: "User created successfully", data: savedUser } });
            } catch (err) {
                console.error("Error saving user:", err);
                res.status(500).json({ error: "Failed to create user" });
            }
        },
        getUserDetails: async (req, res) => {
            try {
                const { userId } = req.query; // Optionally pass `userId` as a query parameter
                let users;
                users = await User.find();
                res.status(200).json({ responseData: { message: "Users fetched successfully", data: users } });
            } catch (err) {
                console.error("Error fetching users:", err);
                res.status(500).json({ error: "Failed to fetch users" });
            }
        },
        updateUser: async (req, res) => {
            try {
                const { userId } = req.params; // User ID from route parameter
                const updateData = req.body; // Data to update


                const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
                    new: true,
                    runValidators: true,
                });

                if (!updatedUser) {
                    return res.status(404).json({ error: "User not found" });
                }

                res.status(200).json({ responseData: { message: "User updated successfully", data: updatedUser } });
            } catch (err) {
                console.error("Error updating user:", err);
                res.status(500).json({ error: "Failed to update user" });
            }
        },

        submitApproval: async (req, res) => {
            try {
                const { header, Item } = req.body;

                if (!header || !Item || !Array.isArray(Item)) {
                    return res.status(400).json({ error: "Invalid request data" });
                }

                const mappedHeader = {
                    project: header.project,
                    function: header.function,
                    date: header.date,
                    companyName: header.companyName,
                    vender1: header.vender1,
                    vender2: header.vender2,
                    WBSElement: header.WBSElement,
                    subject: header.subject,
                };

                let referenceNo;

                // Check and initialize the counter if not already created
                const counter = await Counter.findOneAndUpdate(
                    { name: "approvalReference" },
                    { $inc: { value: 1 } },
                    { new: true, upsert: true, setDefaultsOnInsert: true } // Ensures default is applied when creating
                );

                referenceNo = counter.value;
                console.log("Item", Item)
                const newApproval = new Approval({
                    header: mappedHeader,
                    Item,
                    referenceNo,
                    status: 'In Process'
                });

                const savedApproval = await newApproval.save();

                res.status(200).json({
                    referenceNo,
                    message: "Approval submitted successfully",
                    data: savedApproval,
                });
            } catch (err) {
                console.error("Error submitting approval:", err);
                res.status(500).json({ error: "Failed to submit approval" });
            }
        },


        approvalList: async (req, res) => {
            try {

                const approvals = await Approval.find();

                const formattedData = approvals.map(approval => ({
                    header: {
                        ...approval.header,
                        Item: approval.Item,
                        referenceNo: approval.referenceNo,
                        status: approval.status
                    },
                }));

                res.status(200).json({
                    responseData: {
                        message: "ApprovalList fetched successfully",
                        data: formattedData,
                    },
                });
            } catch (err) {
                console.error("Error fetching approval list:", err);
                res.status(500).json({ error: "Failed to fetch approval list" });
            }
        },
        submitInvoice: async (req, res) => {
            console.log('requestbody', req.body)
            try {
                // const { invoiceHeader,fromName,fromEmail,fromAddress,fromMobileNumber, toName,toEmail,toAddress,toMobileNumber,toGstinNo,
                //     toPan,invoiceNumber,invoiceDate,panNumber,gstinNo,typeOfAircraft,notes } = req.body

                const { header, serviceList, taxList, subtotal, grandTotal, amountInWords, reason, invoiceApprovedOrRejectedByUser,
                    invoiceApprovedOrRejectedDateAndTime, loggedInUser, status, proformaCardHeaderId, proformaCardHeaderName,
                    reviewedDescription, reviewedDate, reviewedLoggedIn, createdByUser, reviewed, reviewedReSubmited, pqSameforTAX,
                    pqStatus, pqUniqueId, ProformaBankAccountNumber, ProformaIFSCcode, ProformaTypeOfServices, detailsCardAddress, ProformaCompanyName
                } = req.body
                console.info("req.body 1", req.body)
                // below is the proforma invoice
                var invoiceUniqueNumber;
                var invoiceDateObj;
                var bookingDate;
                var invoiceReferenceNo;
                let originalUniqueId; // To store the numerical part

                if (proformaCardHeaderId === "PQ") {

                    // Check and initialize the counter if not already created
                    const counter = await invoiceproformaCount.findOneAndUpdate(
                        { name: "invoiceUniqueNumber" },  // Find condition
                        [
                            {
                                $set: {
                                    value: { $add: [{ $ifNull: ["$value", 0] }, 1] }, // Start from 1, not 800
                                    startWith: { $ifNull: ["$startWith", "PQ-2526"] } // Financial year as prefix
                                }
                            }
                        ],
                        { new: true, upsert: true, setDefaultsOnInsert: true }  // Ensure default values are applied
                    );

                    if (header.ProformaInvoiceDate) {
                        invoiceDateObj = moment(header.ProformaInvoiceDate, "DD-MM-YYYY").toDate();
                        console.log("Converted Invoice Date:", invoiceDateObj);
                    } else {
                        throw new Error("ProformaInvoiceDate is required.");
                    }

                    // if (header.startBookingDateOfJourny) {
                    //     startBookingDate = moment(header.startBookingDateOfJourny, "DD-MM-YYYY").toDate();
                    //     console.log("Converted startBookingDate :", startBookingDate);
                    // } else {
                    //     throw new Error("ProformaInvoiceDate is required.");
                    // }
                    // if (header.endBookingDateOfJourny) {
                    //     endBookingDate = moment(header.endBookingDateOfJourny, "DD-MM-YYYY").toDate();
                    //     console.log("Converted endBookingDate :", endBookingDate);
                    // } else {
                    //     throw new Error("ProformaInvoiceDate is required.");
                    // }
                    console.log("counter", counter);

                    invoiceReferenceNo = counter.value.toString().padStart(4, "0"); // Ensure 4-digit format (0001, 0002, etc.)
                    start = counter.startWith;

                    console.log("invoiceReferenceNo", invoiceReferenceNo);

                    const parts = header.ProformaInvoiceDate.split('-'); // Split the date into parts
                    console.log("parts", parts);

                    const mm_yyyy = moment(invoiceDateObj).format("MM-YYYY");
                    console.log("mm_yyyy", mm_yyyy);

                    invoiceUniqueNumber = start + invoiceReferenceNo; // Concatenate startWith + formatted number

                    console.log("start", start, "invoiceUniqueNumber", invoiceUniqueNumber);

                }
                // below is the TAX invoice
                else if (proformaCardHeaderId === "TAX") {


                    const counter = await invoicetaxCount.findOneAndUpdate(
                        { name: "invoiceUniqueNumber" },  // Find condition
                        [
                            {
                                $set: {
                                    value: { $add: [{ $ifNull: ["$value", 0] }, 1] }, // Start from 1, not 800
                                    startWith: { $ifNull: ["$startWith", "2526"] } // Financial year as prefix
                                }
                            }
                        ],
                        { new: true, upsert: true, setDefaultsOnInsert: true }  // Ensure default values are applied
                    );
                    // Update the related PQ record before creating the TAX invoice
                    console.log('pqUniqueId', pqUniqueId)
                    await invoice.findOneAndUpdate(
                        { originalUniqueId: pqUniqueId, proformaCardHeaderId: "PQ" }, // Find the PQ invoice
                        { $set: { pqStatus: "Completed" } }, // Update pqStatus
                        { new: true } // Return the updated document
                    );


                    if (header.ProformaInvoiceDate) {
                        invoiceDateObj = moment(header.ProformaInvoiceDate, "DD-MM-YYYY").toDate();
                        console.log("Converted Invoice Date:", invoiceDateObj);
                    } else {
                        throw new Error("ProformaInvoiceDate is required.");
                    }


                    console.log("counter", counter);

                    invoiceReferenceNo = counter.value.toString().padStart(4, "0"); // Ensure 4-digit format (0001, 0002, etc.)
                    start = counter.startWith;

                    console.log("invoiceReferenceNo", invoiceReferenceNo);

                    const parts = header.ProformaInvoiceDate.split('-'); // Split the date into parts
                    console.log("parts", parts);

                    const mm_yyyy = moment(invoiceDateObj).format("MM-YYYY");
                    console.log("mm_yyyy", mm_yyyy);

                    invoiceUniqueNumber = start + invoiceReferenceNo; // Concatenate startWith + formatted number

                    console.log("start", start, "invoiceUniqueNumber", invoiceUniqueNumber);

                }

                else if (proformaCardHeaderId === "OnlyTAX") {


                    const counter = await invoicetaxCount.findOneAndUpdate(
                        { name: "invoiceUniqueNumber" },  // Find condition
                        [
                            {
                                $set: {
                                    value: { $add: [{ $ifNull: ["$value", 0] }, 1] }, // Start from 1, not 800
                                    startWith: { $ifNull: ["$startWith", "2526"] } // Financial year as prefix
                                }
                            }
                        ],
                        { new: true, upsert: true, setDefaultsOnInsert: true }  // Ensure default values are applied
                    );
                    console.log('pqUniqueId', pqUniqueId)
                    // await invoice.findOneAndUpdate(
                    //     { originalUniqueId: pqUniqueId, proformaCardHeaderId: "PQ" }, 
                    //     { $set: { pqStatus: "Completed" } }, 
                    //     { new: true } 
                    // );


                    if (header.ProformaInvoiceDate) {
                        invoiceDateObj = moment(header.ProformaInvoiceDate, "DD-MM-YYYY").toDate();
                        console.log("Converted Invoice Date:", invoiceDateObj);
                    } else {
                        throw new Error("ProformaInvoiceDate is required.");
                    }


                    console.log("counter", counter);

                    invoiceReferenceNo = counter.value.toString().padStart(4, "0"); // Ensure 4-digit format (0001, 0002, etc.)
                    start = counter.startWith;
                    
                    console.log("invoiceReferenceNo", invoiceReferenceNo);
                    
                    const parts = header.ProformaInvoiceDate.split('-'); // Split the date into parts
                    console.log("parts", parts);
                    
                    const mm_yyyy = moment(invoiceDateObj).format("MM-YYYY");
                    console.log("mm_yyyy", mm_yyyy);
                    
                    invoiceUniqueNumber = start + invoiceReferenceNo; // Concatenate startWith + formatted number
                    
                    console.log("start", start, "invoiceUniqueNumber", invoiceUniqueNumber);

                }

                // Get and increment the SINGLE counter
                const originalId = await uniqueId.findOneAndUpdate(
                    { name: "originalUniqueId" }, // Always find the same counter document
                    { $inc: { value: 1 } },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );

                originalUniqueId = originalId.value; // Store the number
                console.log("invoiceUniqueNumber end", invoiceUniqueNumber)

                const headerObj = {
                    invoiceHeader: header.invoiceHeader,
                    invoiceImage: header.invoiceImage,
                    ProformaCompanyName: header.ProformaCompanyName,
                    ProformaCustomerName: header.ProformaCustomerName,
                    ProformaAddress: header.ProformaAddress,
                    ProformaCity: header.ProformaCity,
                    ProformaState: header.ProformaState,
                    ProformaPincode: header.ProformaPincode,
                    ProformaGstNo: header.ProformaGstNo,
                    ProformaPanNO: header.ProformaPanNO,
                    ProformaInvoiceNumber: header.ProformaInvoiceNumber,
                    ProformaInvoiceDate: invoiceDateObj,
                    ProformaPan: header.ProformaPan,
                    ProformaGstNumber: header.ProformaGstNumber,
                    ProformaTypeOfServices: header.ProformaTypeOfServices,
                    ProformaBankName: header.ProformaBankName,
                    notes: header.notes,
                    ProformaBankAccountNumber: header.ProformaBankAccountNumber,
                    ProformaIFSCcode: header.ProformaIFSCcode,
                    detailsCardAddress: header.detailsCardAddress,


                }
                // const bankObj={
                //     accountName:bankDetails.accountName,
                //     bank:bankDetails.bank,
                //     accountNumber:bankDetails.accountNumber,
                //     branch:bankDetails.branch,
                //     ifscCode:bankDetails.ifscCode,
                // }
                // let status = "Pending"
                // Prepare invoice data object
                const invoiceData = {
                    originalUniqueId,
                    header: headerObj,
                    serviceList,
                    taxList,
                    invoiceReferenceNo,
                    subtotal,
                    grandTotal,
                    amountInWords,
                    status,
                    reason,
                    invoiceApprovedOrRejectedByUser,
                    invoiceUniqueNumber,
                    invoiceApprovedOrRejectedDateAndTime,
                    loggedInUser,
                    proformaCardHeaderId,
                    proformaCardHeaderName,
                    reviewedDescription,
                    reviewedDate,
                    reviewedLoggedIn,
                    createdByUser,
                    reviewed,
                    reviewedReSubmited,
                    pqSameforTAX,
                    pqStatus,
                    pqUniqueId,
                    ProformaBankAccountNumber,
                    ProformaIFSCcode,
                    ProformaTypeOfServices,
                    detailsCardAddress,
                    ProformaCompanyName
                };



                // Create and save the invoice
                const newInvoice = new invoice(invoiceData);
                console.log("newInvoice", newInvoice);

                const savedInvoice = await newInvoice.save();


                recevieInvoiceSendToMail.send()
                res.status(200).json({
                    invoiceReferenceNo,
                    message: "Generated",
                    data: savedInvoice,
                    status: 200
                });

            } catch (err) {
                console.error("Error submitting invoice:", err);

                if (err.code === 11000) {
                    const duplicateInvoiceNumber = err.keyValue?.invoiceUniqueNumber || "Unknown"; // Extracting duplicate value

                    res.status(400).json({
                        message: `A tax invoice has already been created for Selected Proforma Invoice Number`,
                        status: 400
                    });
                } else {
                    res.status(500).json({ message: "Failed to Submit Invoice Creation", error: err.message, status: 500 });
                }

                console.log("error.code", err.code); // Corrected logging

            }
        },



        countryList: async (req, res) => {
            console.log("countries enter into")
            try {
                const countyList = await countries.find();
                console.log("countries", countyList)
                res.status(200).json({
                    responseData: {
                        message: "Countries fetched successfully",
                        data: countyList,
                        status: 200
                    },
                });
            } catch (err) {
                console.error("Error fetching approval list:", err);
                res.status(500).json({
                    error: "Failed to fetch approval list",
                    status: 500

                });
            }
        },
        stateList: async (req, res) => {
            console.log("state enter into");
            try {
                const stateList = await statee.find();
                console.log("state", stateList);
                res.status(200).json({
                    responseData: {
                        message: "State fetched successfully",
                        data: stateList,
                        status: 200
                    },
                });
            } catch (err) {
                console.error("Error fetching state list:", err);
                res.status(500).json({
                    error: "Failed to fetch state list",
                    status: 500
                });
            }
        },




        updateInvoice: async (req, res) => {
            console.log("updateInvoice called");
            try {
                const { referenceNo } = req.params;
                let updateData = req.body;
                console.log("Updating Invoice:", referenceNo, updateData);

                // Ensure the updateData.header exists
                if (updateData.header) {
                    if (updateData.header.ProformaInvoiceDate) {
                        const parsedDate = moment(updateData.header.ProformaInvoiceDate, "DD-MM-YYYY", true);
                        if (parsedDate.isValid()) {
                            updateData.header.ProformaInvoiceDate = parsedDate.toISOString(); // Convert to ISO format
                        } else {
                            return res.status(400).json({
                                message: "Invalid ProformaInvoiceDate format. Use 'DD-MM-YYYY'.",
                                status: 400
                            });
                        }
                    }


                    // if (updateData.header.startBookingDateOfJourny) {
                    //     const parsedDate = moment(updateData.header.startBookingDateOfJourny, "DD-MM-YYYY", true);
                    //     if (parsedDate.isValid()) {
                    //         updateData.header.startBookingDateOfJourny = parsedDate.toISOString(); // Convert to ISO format
                    //     } else {
                    //         return res.status(400).json({
                    //             message: "Invalid startBookingDateOfJourny format. Use 'DD-MM-YYYY'.",
                    //             status: 400
                    //         });
                    //     }
                    // }
                    //     if (updateData.header.endBookingDateOfJourny) {
                    //         const parsedDate = moment(updateData.header.endBookingDateOfJourny, "DD-MM-YYYY", true);
                    //         if (parsedDate.isValid()) {
                    //             updateData.header.endBookingDateOfJourny = parsedDate.toISOString(); // Convert to ISO format
                    //         } else {
                    //             return res.status(400).json({
                    //                 message: "Invalid endBookingDateOfJourny format. Use 'DD-MM-YYYY'.",
                    //                 status: 400
                    //             });
                    //         }
                    //     }
                }

                const updatedInvoice = await invoice.findOneAndUpdate(
                    { originalUniqueId: referenceNo }, // Find invoice by reference number
                    { $set: updateData }, // Apply updates
                    { new: true, runValidators: true }
                );

                if (!updatedInvoice) {
                    return res.status(400).json({
                        message: 'Invoice not found',
                        status: 400
                    });
                }
                // Send email with updated invoice data
                const recipientEmail = "sunilkumar@sharviinfotech.com"; // Replace with the correct recipient email
                //  await sendInvoiceDataToEmail(recipientEmail, JSON.stringify(updatedInvoice, null, 2));
                console.log("send email update")
                recevieInvoiceSendToMail.send()
                res.status(200).json({
                    message: `Proforma Invoice Number ${updatedInvoice.invoiceUniqueNumber} updated successfully`,
                    updatedInvoice,
                    status: 200
                });

            } catch (error) {
                console.error("Error updating invoice:", error);
                res.status(500).json({
                    message: "Failed to update invoice",
                    error: error.message,
                    status: 500
                });
            }
        },





        getTotalInvoice: async (req, res) => {
            try {
                const { userActivity } = req.body;
                console.log("userActivity", userActivity);
                var invoices
                // if (userActivity == 'MD') {

                //     const listOfPQ = await invoice.find({ proformaCardHeaderId: 'PQ' });
                //     invoices = listOfPQ.filter(invoice => invoice.status === "Pending");
                //     console.log("IF MD")


                // }
                // else if (userActivity == 'ACCOUNTS') {

                //     const listOfPQ = await invoice.find({ proformaCardHeaderId: 'PQ' });
                //     invoices = listOfPQ.filter(invoice => invoice.status === "Pending");
                //     console.log("IF MD")


                // }
                // else {
                invoices = await invoice.find();
                console.log("Else ADMIN")

                // }

                console.log('invoices', invoices)
                if (!invoices || invoices.length === 0) {
                    return res.status(200).json({
                        message: "No Data Available",
                        data: [],
                        status: 200
                    });
                }

                // Format the date fields

                const formattedInvoices = invoices.map(inv => ({
                    ...inv._doc,
                    header: {
                        ...inv.header,
                        ProformaInvoiceDate: moment(inv.header.ProformaInvoiceDate).format("DD-MM-YYYY"),
                        // startBookingDateOfJourny: moment(inv.header.startBookingDateOfJourny).format("DD-MM-YYYY"),
                        // endBookingDateOfJourny: moment(inv.header.endBookingDateOfJourny).format("DD-MM-YYYY")
                    }
                }));

                return res.status(200).json({
                    message: "Invoices Fetched Successfully",
                    data: formattedInvoices,
                    status: 200
                });

            } catch (error) {
                console.error("Error fetching invoices:", error);
                return res.status(500).json({
                    message: "Failed to fetch invoices",
                    error: error.message,
                    status: 500
                });
            }
        },


        invoiceLayoutSubmit: async (req, res) => {
            console.log('request body', req.body);
            try {
                const { invoiceLayoutId, header, serviceList, taxList, subtotal, grandTotal, status } = req.body;
                console.info("req.body", req.body);

                const headerObj = {
                    invoiceHeader: header.invoiceHeader,
                    invoiceImage: header.invoiceImage,
                    ProformaCustomerName: header.ProformaCustomerName,
                    ProformaAddress: header.ProformaAddress,
                    ProformaCity: header.ProformaCity,
                    ProformaState: header.ProformaState,
                    ProformaPincode: header.ProformaPincode,
                    ProformaGstNo: header.ProformaGstNo,
                    ProformaPanNO: header.ProformaPanNO,
                    ProformaInvoiceNumber: header.ProformaInvoiceNumber,
                    ProformaInvoiceDate: header.ProformaInvoiceDate,
                    ProformaPan: header.ProformaPan,
                    ProformaGstNumber: header.ProformaGstNumber,
                    ProformaTypeOfServices: header.ProformaTypeOfServices,
                    ProformaBankName: header.ProformaBankName,
                    notes: header.notes,
                    ProformaBankAccountNumber: ProformaBankAccountNumber,
                    ProformaIFSCode: ProformaIFSCode,
                    ProformaAddress: header.ProformaAddress,
                };


                // const bankObj = {
                //     accountName: bankDetails.accountName,
                //     bank: bankDetails.bank,
                //     accountNumber: bankDetails.accountNumber,
                //     branch: bankDetails.branch,
                //     ifscCode: bankDetails.ifscCode,
                // };

                // Delete the existing record to ensure only one record exists
                await layout.deleteMany({});

                // Save the latest record
                const newLayout = new layout({
                    invoiceLayoutId,
                    header: headerObj,
                    serviceList,
                    taxList,
                    subtotal,
                    grandTotal,
                    status
                    // bankDetails: bankObj
                });

                const savedLayout = await newLayout.save();

                res.status(200).json({
                    message: "Invoice Layout Saved Successfully",
                    data: savedLayout,
                    status: 200
                });

            } catch (err) {
                console.error("Error submitting Layout:", err);
                res.status(500).json({
                    error: "Failed to Submit Invoice Layout",
                    status: 500
                });
            }
        },
        getAllInvoiceLayout: async (req, res) => {

            try {
                const invoiceLayoutData = await layout.find();

                if (invoiceLayoutData.length === 0) {
                    return res.status(404).json({
                        message: "No Invoices Found",
                        status: 404
                    })
                }

                return res.json({ message: "Invoice Layouts Fetched Successfully", invoiceLayoutData })

            } catch (error) {
                console.log("error invoice", error)

                res.json({ error: error.message })
            }
        },

        // userCreationSave:async(req,res)=>{
        //     console.log("saveNewUserCreation",req,res)
        //     try{

        //     const {userName,userFirstName,userLastName,userEmail, userContact,userPassword, userConfirmPassword,userStatus,userActivity} = req.body;
        //     let userUniqueId;
        //     // Check and initialize the counter if not already created
        //     const counter = await invoiceCount.findOneAndUpdate(
        //         { name: "userUniqueId" },  // Find condition
        //         { 
        //             $inc: { value: 1 }, 
        //         },  
        //         { new: true, upsert: true, setDefaultsOnInsert: true }  // Ensure default values are applied
        //     );
        //     console.log("counter",counter)
        //     userUniqueId = counter.value;
        //          const userPayload = new userCreation({
        //             userName,
        //             userFirstName,
        //             userLastName,
        //             userEmail,
        //             userContact,
        //             userPassword,
        //             userConfirmPassword,
        //             userStatus,
        //             userActivity,
        //             userUniqueId

        //          });

        //          const saveNewUser = await userPayload.save()
        //          console.log('saveNewUser',saveNewUser)
        //          let obj ={
        //             userName:saveNewUser.userName,
        //             userStatus:saveNewUser.userStatus,
        //             userActivity:saveNewUser.userActivity,
        //             userUniqueId:userUniqueId
        //          }
        //          console.log('obj',obj)
        //          res.status(200).json({
        //             message:"User Created Succesfully",
        //             data:obj,
        //             status:200,

        //          })


        //     }catch(error){
        //      res.json({
        //         message:"Failed To Save the User",
        //         status:500
        //      })
        //     }
        // },
        getAllUserLists: async (req, res) => {
            try {
                const usersList = await userCreation.find()
                console.log("usersList", usersList)
                if (usersList.length === 0) {
                    res.json({
                        message: "No Data Available",
                        status: 200
                    })
                }
                res.json({
                    message: "User Data Fetched Successfully",
                    data: usersList,
                    status: 200
                })

            } catch (error) {

                res.json({
                    error: error.message
                })
            }
        },

        //     updateUserCreation:async(req,res)=>{
        //      console.log("updateUserCreation req",req,"res",res)
        //      try{
        //         const {UniqueId}=req.params;
        //         const updateUserData = req.body;
        //         console.log("UniqueId",UniqueId,"updateUserData",updateUserData);
        //         const updateUserObj = await userCreation.findOneAndUpdate(
        //             {userUniqueId:UniqueId},
        //             {$set:updateUserData},
        //             {new:true,runValidators:true}
        //         )

        //         if(!updateUserObj){
        //           return res.status(400).json({
        //             message:"User Not Found",
        //             status:400
        //           })
        //         }
        //         res.status(200).json({
        //             message:"User Updated successfully",updateUserObj,
        //             status:200
        //         })

        //      }catch(error){
        //         console.log("updateUserCreation error",error)
        //         res.status(500).json({
        //             error:error.message,
        //             status:500
        //         })
        //      }

        //     },
        //    userLogin :async(req, res) => {

        //         try {
        //             const { userName, userPassword } = req.body;

        //             // Find user by userName
        //             const user = await userCreation.findOne({ userName });

        //             if (!user) {
        //                 return res.status(404).json({
        //                     message: "User Not Found",
        //                     status: 404,
        //                     isValid: false
        //                 });
        //             }

        //             // Compare password securely
        //             console.log('userPassword',userPassword,"user.userPassword",user.userPassword)
        //             const isMatch = await bcrypt.compare(userPassword, user.userPassword);
        //             console.log('isMatch',isMatch)
        //             if (!isMatch) {
        //                 return res.status(400).json({
        //                     message: "Invalid credentials",
        //                     status: 400,
        //                     isValid: false
        //                 });
        //             }

        //             // Generate JWT Token
        //             const token = jwt.sign(
        //                 { id: user._id, userName: user.userName },
        //                 "your_jwt_secret",
        //                 { expiresIn: "1h" }
        //             );

        //             return res.status(200).json({
        //                 message: "Login successful",
        //                 status: 200,
        //                 isValid: true,
        //                 token // Include token in response
        //             });

        //         } catch (error) {
        //             return res.status(500).json({
        //                 message: "Server error",
        //                 status: 500,
        //                 isValid: false,
        //                 error: error.message
        //             });
        //         }
        //     }




        // new code start
        // userCreationSave: async (req, res) => {
        //     try {
        //         console.log("req.body",req.body)
        //         const { userName, userFirstName, userLastName, userEmail, userContact, userPassword, userConfirmPassword, userStatus, userActivity } = req.body;
        //         console.log("userPassword",userPassword,"userConfirmPassword",userConfirmPassword)
        //         if (userPassword !== userConfirmPassword) {
        //             return res.status(400).json({ message: "Passwords do not match", status: 400 });
        //         }

        //         const existingUser = await userCreation.findOne({ userEmail });
        //         if (existingUser) {
        //             return res.status(400).json({ message: "User with this email already exists", status: 400 });
        //         }

        //         const counter = await invoiceCount.findOneAndUpdate(
        //             { name: "userUniqueId" },
        //             { $inc: { value: 1 } },
        //             { new: true, upsert: true, setDefaultsOnInsert: true }
        //         );
        //         const userUniqueId = counter.value;
        //         console.log("userUniqueId",userUniqueId)
        //         const hashedPassword = await bcrypt.hash(userPassword, 10);
        //          console.log("hashedPassword",hashedPassword)
        //         const userPayload = new userCreation({
        //             userName,
        //             userFirstName,
        //             userLastName,
        //             userEmail,
        //             userContact,
        //             userPassword: hashedPassword,
        //             userConfirmPassword:hashedPassword,
        //             userStatus,
        //             userActivity,
        //             userUniqueId
        //         });

        //         const saveNewUser = await userPayload.save();
        //         res.status(201).json({
        //             message: "User Created Successfully",
        //             data: {
        //                 userName: saveNewUser.userName,
        //                 userStatus: saveNewUser.userStatus,
        //                 userActivity: saveNewUser.userActivity,
        //                 userUniqueId: saveNewUser.userUniqueId
        //             },
        //             status: 201
        //         });
        //     } catch (error) {
        //         res.status(500).json({ message: "Failed to save the user", status: 500, error: error.message });
        //     }
        // },

        // updateUserCreation: async (req, res) => {
        //     try {
        //         const { UniqueId } = req.params;
        //         const updateUserData = req.body;
        //         if (updateUserData.userPassword) {
        //             updateUserData.userPassword = await bcrypt.hash(updateUserData.userPassword, 10);
        //         }

        //         const updateUserObj = await userCreation.findOneAndUpdate(
        //             { userUniqueId: UniqueId },
        //             { $set: updateUserData },
        //             { new: true, runValidators: true }
        //         );

        //         if (!updateUserObj) {
        //             return res.status(404).json({ message: "User Not Found", status: 404 });
        //         }

        //         res.status(200).json({ message: "User Updated Successfully", data: updateUserObj, status: 200 });
        //     } catch (error) {
        //         res.status(500).json({ message: "Update Failed", status: 500, error: error.message });
        //     }
        // },
        userCreationSave: async (req, res) => {
            console.log("userCreationSave", req, res)
            try {
                console.log("req.body", req.body);
                const { userName, userFirstName, userLastName, userEmail, userContact, userPassword, userConfirmPassword, userStatus, userActivity } = req.body;
                console.log("userPassword", userPassword, "userConfirmPassword", userConfirmPassword);

                if (userPassword !== userConfirmPassword) {
                    return res.status(400).json({ message: "Passwords do not match", status: 400 });
                }

                const existingUser = await userCreation.findOne({ userEmail });
                if (existingUser) {
                    return res.status(400).json({ message: "User with this email already exists", status: 400 });
                }

                const counter = await userCount.findOneAndUpdate(
                    { name: "userUniqueId" },
                    { $inc: { value: 1 } },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
                const userUniqueId = counter.value;
                console.log("userUniqueId", userUniqueId);

                // Do NOT hash the password, save it as plain text
                const userPayload = new userCreation({
                    userName,
                    userFirstName,
                    userLastName,
                    userEmail,
                    userContact,
                    userPassword, // Store plain text password
                    userConfirmPassword, // Store plain text confirm password (you might not need to save this)
                    userStatus,
                    userActivity,
                    userUniqueId
                });

                const saveNewUser = await userPayload.save();
                res.status(201).json({
                    message: "User Created Successfully",
                    data: {
                        userName: saveNewUser.userName,
                        userStatus: saveNewUser.userStatus,
                        userActivity: saveNewUser.userActivity,
                        userUniqueId: saveNewUser.userUniqueId
                    },
                    status: 201
                });
            } catch (error) {
                res.status(500).json({ message: "Failed to save the user", status: 500, error: error.message });
            }
        },

        updateUserCreation: async (req, res) => {
            try {
                const { UniqueId } = req.params;
                const updateUserData = req.body;

                // If the password is being updated, keep it as plain text (no hashing)
                if (updateUserData.userPassword) {
                    updateUserData.userPassword = updateUserData.userPassword; // Don't hash the password
                }

                const updateUserObj = await userCreation.findOneAndUpdate(
                    { userUniqueId: UniqueId },
                    { $set: updateUserData },
                    { new: true, runValidators: true }
                );

                if (!updateUserObj) {
                    return res.status(404).json({ message: "User Not Found", status: 404 });
                }

                res.status(200).json({ message: "User Updated Successfully", data: updateUserObj, status: 200 });
            } catch (error) {
                res.status(500).json({ message: "Update Failed", status: 500, error: error.message });
            }
        },


        userLogin: async (req, res) => {
            try {
                const { userName, userPassword } = req.body; // Get username and password
                console.log("userName", userName, userPassword);

                const user = await userCreation.findOne({ userName }); // Find user by username
                console.log("user", user)
                if (!user) {
                    return res.status(404).json({
                        message: "User Not Found. Please enter a valid User",
                        status: 404,
                        isValid: false
                    });
                }
                let obj = {
                    userName: user.userName,
                    userFirstName: user.userFirstName,
                    userLastName: user.userLastName,
                    userEmail: user.userEmail,
                    userUniqueId: user.userUniqueId,
                    userStatus: user.userStatus,
                    isValid: user.userStatus,
                    userActivity: user.userActivity
                }
                console.log("password", userPassword, "user.userPassword", user.userPassword);
                if (user.userStatus == false) {
                    return res.status(200).json({
                        message: "User Not In Active",
                        status: 200,
                        data: obj,
                    });
                }
                // Compare plain password directly
                if (userPassword !== user.userPassword) {
                    return res.status(400).json({
                        message: "Invalid Credentials",
                        status: 400,
                        isValid: false
                    });
                }

                const token = jwt.sign(
                    { id: user._id, userName: user.userName }, // JWT payload with username
                    process.env.JWT_SECRET || "your_jwt_secret",
                    { expiresIn: "1h" }
                );



                res.status(200).json({
                    message: "Login Successful",
                    status: 200,
                    data: obj,
                    token
                });
            } catch (error) {
                res.status(500).json({ message: "Server Error", status: 500, isValid: false, error: error.message });
            }
        },
        // approvedOrRejected: async (req, res) => {
        //     console.log("req.body", req.body)
        //     try {
        //         const { originalUniqueId, status, reason, invoiceApprovedOrRejectedByUser, invoiceApprovedOrRejectedDateAndTime, reviewedReSubmited } = req.body; // Extract only required fields

        //         if (!originalUniqueId || !status) {
        //             return res.status(400).json({ message: "userUniqueId and status are required", status: 400 });
        //         }

        //         // Find and update the user with new status and remarkReason
        //         const updatedUser = await invoice.findOneAndUpdate(
        //             { originalUniqueId }, // Search by userUniqueId
        //             {
        //                 $set: { status, reason, invoiceApprovedOrRejectedByUser, invoiceApprovedOrRejectedDateAndTime, reviewedReSubmited } // Update or add status & remarkReason
        //             },
        //             { new: true, runValidators: true } // Return updated document
        //         );

        //         if (!updatedUser) {
        //             return res.status(404).json({ message: "User Not Found", status: 404 });
        //         }
        //         recevieInvoiceSendToMail.send()
        //         res.status(200).json({ message: "Status Updated Successfully", data: updatedUser, status: 200 });

        //     } catch (error) {
        //         res.status(500).json({ message: "Update Failed", status: 500, error: error.message });
        //     }
        // },


        approvedOrRejected: async (req, res) => {
            console.log("req.body", req.body);
            try {
                const { originalUniqueId, status, reason, invoiceApprovedOrRejectedByUser, invoiceApprovedOrRejectedDateAndTime, reviewedReSubmited } = req.body;

                if (!originalUniqueId || !status) {
                    return res.status(400).json({ message: "originalUniqueId and status are required", status: 400 });
                }

                // Find and update the invoice with the new status and reason
                const updatedInvoice = await invoice.findOneAndUpdate(
                    { originalUniqueId },
                    {
                        $set: { status, reason, invoiceApprovedOrRejectedByUser, invoiceApprovedOrRejectedDateAndTime, reviewedReSubmited }
                    },
                    { new: true, runValidators: true }
                );

                if (!updatedInvoice) {
                    return res.status(404).json({ message: "Invoice Not Found", status: 404 });
                }

                // Sending email after update (assuming this function exists)
                recevieInvoiceSendToMail.send();

                // Determine success message based on status
                const successMessage = status === "Rejected"
                    ? "Rejected successfully"
                    : status === "Approved"
                        ? "Approved successfully"
                        : "Status Updated Successfully";

                res.status(200).json({ message: successMessage, data: updatedInvoice, status: 200 });

            } catch (error) {
                res.status(500).json({ message: "Update Failed", status: 500, error: error.message });
            }
        },

        approvedOrRejectedMail: async (req, res) => {
            try {
                console.log("req.query", req.query)
                const { originalUniqueId, status, reason, invoiceApprovedOrRejectedByUser, invoiceUniqueNumber } = req.query;

                if (!originalUniqueId || !status) {
                    return res.send(`
                        <script>
                            var newWindow = window.open("", "_blank", "width=400,height=200");
                            newWindow.document.write('<p style="font-size:18px;">Invalid request. Missing required parameters.</p>');
                              setTimeout(() => {
            newWindow.close();
            window.close();
        }, 5000);
                        </script>
                    `);
                }
                // Get current date and time in "dd-mm-yyyy hh:mm am/pm" format
                let invoiceApprovedOrRejectedDateAndTime = new Date().toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                }).replace(",", "");

                // Find and update the invoice
                const updatedInvoice = await invoice.findOneAndUpdate(
                    { originalUniqueId },
                    { $set: { status, reason, invoiceApprovedOrRejectedByUser, invoiceApprovedOrRejectedDateAndTime } },
                    { new: true, runValidators: true }
                );

                if (!updatedInvoice) {
                    return res.send(`
                        <script>
                            var newWindow = window.open("", "_blank", "width=400,height=200");
                            newWindow.document.write('<p style="font-size:18px;">Invoice not found.</p>');
                            setTimeout(() => newWindow.close();window.close(), 5000);
                        </script>
                    `);
                }

                res.send(`
                  <script>
        var newWindow = window.open("", "_blank", "width=400,height=200");
        newWindow.document.write('<p style="font-size:18px;">Invoice Number ${invoiceUniqueNumber} has been ${status} successfully!</p>');
        
        setTimeout(() => {
            newWindow.close();
            window.close();
        }, 5000);
    </script>
                `);
                recevieInvoiceSendToMail.send()

            } catch (error) {
                res.send(`
                    <script>
                        var newWindow = window.open("", "_blank", "width=400,height=200");
                        newWindow.document.write('<p style="font-size:18px; color:red;">Update Failed: ${error.message}</p>');
                          setTimeout(() => {
            newWindow.close();
            window.close();
        }, 3000);
                    </script>
                `);
            }
        },
        reviewedInvoice: async (req, res) => {
            console.log("req.body", req.body);
            try {
                const { originalUniqueId, reviewedDescription, reviewedDate, reviewedLoggedIn, reviewed, reviewedReSubmited } = req.body; // Extract only required fields

                if (!originalUniqueId) {
                    return res.status(400).json({ message: "userUniqueId and status are required", status: 400 });
                }

                // Find and update the user with new status and remarkReason
                const updatedUser = await invoice.findOneAndUpdate(
                    { originalUniqueId }, // Search by userUniqueId
                    {
                        $set: { reviewedDescription, reviewedDate, reviewedLoggedIn, reviewed, reviewedReSubmited } // Update or add status & remarkReason
                    },
                    { new: true, runValidators: true } // Return updated document
                );

                if (!updatedUser) {
                    return res.status(404).json({ message: "User Not Found", status: 404 });
                }

                res.status(200).json({ message: "Description saved Successfully", data: updatedUser, status: 200 });

            } catch (error) {
                res.status(500).json({ message: "Description saved Failed", status: 500, error: error.message });
            }
        },




        fetchInvoiceBasedOnDates: async (req, res) => {
            try {
                console.log('req.body', req.body);
                const { fromInvoiceDate, toInvoiceDate, status } = req.body;

                // Convert input dates to start and end of the day
                const fromDate = moment(fromInvoiceDate, "DD-MM-YYYY").startOf('day').toDate();
                const toDate = moment(toInvoiceDate, "DD-MM-YYYY").endOf('day').toDate();

                // Validate status
                const validStatuses = ["Approved", "Rejected", "Pending"];
                if (!validStatuses.includes(status)) {
                    return res.status(400).json({ message: "Invalid status value", status: 400 });
                }

                console.log("fromDate", fromDate, "toDate", toDate);

                // Fetch invoices with the correct date filtering
                const invoices = await invoice.find({
                    ProformaInvoiceDate: { $gte: fromDate, $lte: toDate },
                    status: status
                });

                console.log("invoices", invoices);

                if (invoices.length === 0) {
                    return res.status(200).json({ message: "No invoices found", status: 200 });
                }

                return res.status(200).json({ message: "Invoices fetched successfully", data, status: 200 });

            } catch (error) {
                console.error("Error fetching invoices:", error);
                return res.status(500).json({ message: "Internal Server Error", error: error.message });
            }
        },
        newCustomerCreation: async (req, res) => {
            console.log("newCustomerCreation ", req, res)
            try {
                const { customerName, customerAddress, customerCity, customerState, customerPincode, customerGstNo, customerPanNo, customerEmail, customerContact, customerAlernativecontact, customerCreditPeriod } = req.body;

                const counter = await customerCount.findOneAndUpdate(
                    { name: "customerUniqueId" },
                    { $inc: { value: 1 } },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
                const customerUniqueId = counter.value;
                console.log("customerUniqueId", customerUniqueId);
                const customerPayload = new customerCreation({
                    customerName,
                    customerAddress,
                    customerCity,
                    customerState,
                    customerPincode,
                    customerGstNo,
                    customerPanNo,
                    customerEmail,
                    customerContact,
                    customerAlernativecontact,
                    customerCreditPeriod,
                    customerUniqueId

                })

                const NewCustomersList = await customerPayload.save()

                res.status(200).json({
                    message: "New Customer Created Successfully",
                    status: 200,
                    data: NewCustomersList,
                    customerUniqueId
                })

            } catch (error) {
                res.status(500), json({
                    message: "Failed to Save Customer",
                    status: 500,
                })
            }
        },

        updateCustomer: async (req, res) => {
            console.log("req.params:", req.params, "req.body:", req.body);

            try {
                const customerUniqueId = Number(req.params.customerUniqueId); // Convert to number
                if (isNaN(customerUniqueId)) {
                    return res.status(400).json({
                        message: "Invalid Customer ID",
                        status: 400
                    });
                }

                const updateObj = req.body;
                console.log("customerUniqueId:", customerUniqueId);
                console.log("updateObj:", updateObj);

                const updateUserObj = await customerCreation.findOneAndUpdate(
                    { customerUniqueId: customerUniqueId },
                    { $set: updateObj },
                    { new: true, runValidators: true }
                );

                console.log("updateUserObj:", updateUserObj);

                if (!updateUserObj) {
                    return res.status(404).json({
                        message: "Customer Not Found",
                        status: 404
                    });
                }

                res.status(200).json({
                    message: "Customer Data Updated Successfully",
                    status: 200,
                    updatedCustomer: updateUserObj
                });

            } catch (error) {
                console.error("Error updating customer:", error);
                res.status(500).json({
                    message: "Failed to Update Customer",
                    status: 500
                });
            }
        },

        listOfCustomers: async (req, res) => {
            try {
                const customersList = await customerCreation.find()

                if (!customersList || customersList.length === 0) {
                    return res.status(200).json({
                        message: "No Data Available",
                        customersList: [],
                        status: 200
                    })

                }

                res.status(200).json({
                    message: "Customer Data Fetched Successfully",
                    data: customersList,
                    status: 200
                })

            } catch (error) {
                res.status(500).json({
                    message: "Failed to Fetch Cstomers Data"
                })

            }

        },
        forgotPassword: async (req, res) => {

            console.log("forgotPassword", req.res)
            try {
                const { userEmail } = req.body;
                console.log("userEmail", userEmail)
                if (!userEmail) {
                    return res.status(400).json({ message: "Email is required" });
                }
                const user = await userCreation.findOne({ userEmail: userEmail });
                console.log("user", user)
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                let obj = {
                    userUniqueId: user.userUniqueId,
                    userEmail: user.userEmail,
                    userName: user.userName,
                    userPassword: user.userPassword,
                }

                res.status(200).json({
                    message: "Password reset email sent successfully",
                    status: 200,
                    data: obj
                })
                enterIntoSendMail(obj)
            }
            catch (error) {
                res.status(500).json({
                    message: "500 Internal Server Error",
                    status: 500
                })
            }

        },
        resetPassword: async (req, res) => {
            console.log("resetPassword req.body", req.body)
            try {
                const { userUniqueId, userName, currentPassword, newPassword, confirmPassword } = req.body;

                // Check if user exists
                const user = await userCreation.findOne({ userName });
                if (!user) {
                    return res.status(404).json({ message: "User not found", status: 404 });
                }

                // Verify current password (since no hashing, we do a direct comparison)
                if (user.userPassword !== currentPassword) {
                    return res.status(400).json({ message: "Current password is incorrect", status: 400 });
                }

                // Check if new password and confirm password match
                if (newPassword !== confirmPassword) {
                    return res.status(400).json({ message: "Please check New password and confirm password", status: 400 });
                }

                // Update password in database
                user.userPassword = newPassword;
                user.userConfirmPassword = confirmPassword;
                await user.save();

                res.status(200).json({ message: "Password reset successfully", status: 200 });

            } catch (error) {
                res.status(500).json({ message: "Failed to reset password", status: 500, error: error.message });
            }
        },


        chargesSubmit: async (req, res) => {

            try {
                console.log("req.body", req.body)
                const { servicesName, customerName, companyName, poNumber } = req.body;


                const counter = await chargesCount.findOneAndUpdate(
                    { name: "chargesUniqueId" },
                    { $inc: { value: 1 } },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
                const chargesUniqueId = counter.value;
                console.log("chargesUniqueId", chargesUniqueId);
                const chargesPayload = new chargesCreation({
                    servicesName,
                    customerName,
                    companyName,
                    poNumber,
                    chargesUniqueId

                })
                console.log("chargesPayload", chargesPayload);
                const NewchargesList = await chargesPayload.save()
                console.log("NewchargesList", NewchargesList);
                res.status(200).json({
                    message: "New Charges Created Successfully",
                    status: 200,
                    data: NewchargesList,
                    chargesUniqueId
                })

            } catch (error) {
                res.status(500).json({
                    message: "500 Internal Server Error",
                    status: 500
                })

            }
        },
        UpdateSubmit: async (req, res) => {
            try {
                console.log('req.body', req.body)
                const { chargesUniqueId } = req.body;
                const updateChargesData = req.body;



                const updateChargesObj = await chargesCreation.findOneAndUpdate(
                    { chargesUniqueId: chargesUniqueId },
                    { $set: updateChargesData },
                    { new: true, runValidators: true }
                );

                if (!updateChargesObj) {
                    return res.status(404).json({ message: "Service Charges Not Found", status: 404 });
                }

                res.status(200).json({ message: "Service Charges  Updated Successfully", data: updateChargesObj, status: 200 });
            } catch (error) {
                res.status(500).json({ message: "Update Failed", status: 500, error: error.message });
            }
        },
        listOfCharges: async (req, res) => {
            try {
                console.log("chargesCreation", chargesCreation)
                const chargesData = await chargesCreation.find()
                console.log("chargesData", chargesData)
                if (!chargesData || chargesData.length === 0) {
                    return res.status(200).json({
                        message: "No Data Available",
                        data: [],
                        status: 200
                    })

                }

                res.status(200).json({
                    message: "Charges Data Fetched Successfully",
                    data: chargesData,
                    status: 200
                })

            } catch (error) {
                res.status(500).json({
                    message: "Failed to Fetch Cstomers Data"
                })

            }

        },

        getNotification: async (req, res) => {
            try {
                const invoices = await invoice.find();
                console.log("invoices", invoices);

                if (!invoices || invoices.length === 0) {
                    return res.status(200).json({
                        message: "No Data Available",
                        data: [],
                        notificationCount: 0,
                        status: 200
                    });
                }

                // Filter invoices where reviewed is true
                const reviewedInvoicesAdmin = invoices.filter(inv => inv.reviewed === true);
                const reviewedInvoicesMD = invoices.filter(inv => inv.reviewedReSubmited === true);

                // Format the date fields
                const adminNotificationList = reviewedInvoicesAdmin.map(inv => ({
                    ...inv._doc,
                    header: {
                        ...inv.header,
                        ProformaInvoiceDate: moment(inv.header.ProformaInvoiceDate).format("DD-MM-YYYY"),
                        // startBookingDateOfJourny: moment(inv.header.startBookingDateOfJourny).format("DD-MM-YYYY"),
                        // endBookingDateOfJourny: moment(inv.header.endBookingDateOfJourny).format("DD-MM-YYYY")
                    }
                }));

                // Format the date fields
                const mdNotificationList = reviewedInvoicesMD.map(inv => ({
                    ...inv._doc,
                    header: {
                        ...inv.header,
                        ProformaInvoiceDate: moment(inv.header.ProformaInvoiceDate).format("DD-MM-YYYY"),
                        // startBookingDateOfJourny: moment(inv.header.startBookingDateOfJourny).format("DD-MM-YYYY"),
                        // endBookingDateOfJourny: moment(inv.header.endBookingDateOfJourny).format("DD-MM-YYYY")
                    }
                }));

                return res.status(200).json({
                    adminMessage: "Pending Corrections Fetched Successfully",
                    mdMessage: "Pending Corrections Fetched Successfully",
                    adminList: adminNotificationList,
                    mdList: mdNotificationList,
                    adminNotificationCount: adminNotificationList.length,
                    mdNotificationCount: mdNotificationList.length,
                    status: 200
                });

            } catch (error) {
                console.error("Error fetching invoices:", error);
                res.status(500).json({
                    message: "Failed to Fetch Invoices Data",
                    error: error.message
                });
            }
        },
        verifyedAndUpdated: async (req, res) => {
            try {
                console.log("verifyedAndUpdated req.body:", JSON.stringify(req.body, null, 2));

                const { originalUniqueId, reviewed, reviewedReSubmited } = req.body;

                if (!originalUniqueId) {
                    return res.status(400).json({ message: "originalUniqueId is required", status: 400 });
                }

                const updatedUser = await invoice.findOneAndUpdate(
                    { originalUniqueId },
                    { $set: { reviewed, reviewedReSubmited } },
                    { new: true, runValidators: true }
                );

                if (!updatedUser) {
                    return res.status(404).json({ message: "Invoice Not Found", status: 404 });
                }

                // ✅ Instead of calling getNotification() here, return updated notifications
                const remainingInvoices = await invoice.find({ reviewed: false });
                recevieInvoiceSendToMail.send()
                res.status(200).json({
                    message: "Verified and updated successfully",
                    data: updatedUser,
                    notificationCount: remainingInvoices.length, // Updated count
                    status: 200
                });

            } catch (error) {
                console.error("Error in verifyedAndUpdated:", error);
                res.status(500).json({ message: "Verification update failed", status: 500, error: error.message });
            }
        },

        deleteGlobally: async (req, res) => {
            try {
                const { globalId, screenName } = req.body;
                console.log("globalId", globalId, "typeOfTable", screenName)
                if (!globalId || !screenName) {
                    return res.status(400).json({ message: "Missing required fields", status: 400 });
                }

                let deletedRecord;

                switch (screenName) {
                    case "invoice":
                        deletedRecord = await invoice.findOneAndDelete({ originalUniqueId: globalId });
                        break;
                    case "customer":
                        deletedRecord = await customerCreation.findOneAndDelete({ customerUniqueId: globalId });
                        break;
                    case "charges":
                        deletedRecord = await chargesCreation.findOneAndDelete({ chargesUniqueId: globalId });
                        break;
                    case "user":
                        deletedRecord = await userCreation.findOneAndDelete({ userUniqueId: globalId });
                        break;
                    case "servicescharge":
                        deletedRecord = await chargesCreation.findOneAndDelete({ chargesUniqueId: globalId });
                        break;
                    case "company":
                        deletedRecord = await companyCreate.findOneAndDelete({ companyUniqueId: globalId });
                        break;
                    default:
                        return res.status(400).json({ message: "Invalid table type", status: 400 });
                }
                console.log("deletedRecord", deletedRecord)

                if (!deletedRecord) {
                    return res.status(404).json({ message: "Record not found", status: 404 });
                }

                res.status(200).json({ message: "Record deleted successfully", status: 200 });
            } catch (error) {
                console.error("Error in deleteGlobally:", error);
                res.status(500).json({ message: "Deletion failed", status: 500, error: error.message });
            }
        },
        newCompanyCreation: async (req, res) => {
            // console.log("newCompanyCreation ", req, res)
            console.log("newCompanyCreation request received");
            try {

                const { companyName, companyAddress, companyCity, companyState, companyPincode, companyGstNo, companyPanNo, companyEmail, companyFinanceContact, companyAlernativecontact, companyBankName, companyBankAccount_No, companyIFSCcode, companyBranchName } = req.body;

                const counter = await companyCount.findOneAndUpdate(
                    { name: "companyUniqueId" },
                    { $inc: { value: 1 } },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
                const companyUniqueId = counter.value;
                console.log("companyUniqueId", companyUniqueId);
                const companyPayload = new companyCreate({
                    companyName,
                    companyAddress,
                    companyCity,
                    companyState,
                    companyPincode,
                    companyGstNo,
                    companyPanNo,
                    companyEmail,
                    companyFinanceContact,
                    companyAlernativecontact,
                    companyBankName,
                    companyBankAccount_No,
                    companyIFSCcode,
                    companyBranchName,
                    companyUniqueId

                })

                const NewCompanysList = await companyPayload.save()

                res.status(200).json({
                    message: "New Company Created Successfully",
                    status: 200,
                    data: NewCompanysList,
                    companyUniqueId
                })

            } catch (error) {
                console.error("Error in newCompanyCreation:", error);
                res.status(500).json({
                    message: "Failed to Save Company",
                    status: 500,
                    error: error.message
                })
            }
        },
        updateCompany: async (req, res) => {
            console.log("req.params:", req.params, "req.body:", req.body);

            try {
                const companyUniqueId = Number(req.body.companyUniqueId); // Convert to number
                if (isNaN(companyUniqueId)) {
                    return res.status(400).json({
                        message: "Invalid Customer ID",
                        status: 400
                    });
                }

                const updateObj = req.body;
                console.log("companyUniqueId:", companyUniqueId);
                console.log("updateObj:", updateObj);

                const updateUserObj = await companyCreate.findOneAndUpdate(
                    { companyUniqueId: companyUniqueId },
                    { $set: updateObj },
                    { new: true, runValidators: true }
                );

                console.log("updateUserObj:", updateUserObj);

                if (!updateUserObj) {
                    return res.status(404).json({
                        message: "Company Not Found",
                        status: 404
                    });
                }

                res.status(200).json({
                    message: "Company Data Updated Successfully",
                    status: 200,
                    updatedCompany: updateUserObj
                });

            } catch (error) {
                console.error("Error updating company:", error);
                res.status(500).json({
                    message: "Failed to Update Company",
                    status: 500,
                    error: error.message
                });
            }
        },
        listOfCompany: async (req, res) => {
            try {
                const companyList = await companyCreate.find()

                if (!companyList || companyList.length === 0) {
                    return res.status(200).json({
                        message: "No Data Available",
                        companyList: [],
                        status: 200
                    })

                }

                res.status(200).json({
                    message: "Company Data Fetched Successfully",
                    data: companyList,
                    status: 200
                })

            } catch (error) {
                res.status(500).json({
                    message: "Failed to Fetch Company Data",
                    error: error.message
                })

            }

        },




        // below is the username and password
        // userLogin: async (req, res) => {
        //     try {
        //         const { userName, userPassword } = req.body;
        //         const user = await userCreation.findOne({ userName });

        //         if (!user) {
        //             return res.status(404).json({ message: "User Not Found", status: 404, isValid: false });
        //         }
        //         console.log("userPassword",userPassword,"user.userPassword",user.userPassword)
        //         const isMatch = await bcrypt.compare(userPassword, user.userPassword);
        //         console.log("isMatch",isMatch)
        //         if (!isMatch) {
        //             return res.status(400).json({ message: "Invalid Credentials", status: 400, isValid: false });
        //         }

        //         const token = jwt.sign(
        //             { id: user._id, userName: user.userName },
        //             process.env.JWT_SECRET || "your_jwt_secret",
        //             { expiresIn: "1h" }
        //         );

        //         res.status(200).json({ message: "Login Successful", status: 200, isValid: true, token });
        //     } catch (error) {
        //         res.status(500).json({ message: "Server Error", status: 500, isValid: false, error: error.message });
        //     }
        // }

        // below is the email and password
        // userLogin: async (req, res) => {
        //     try {
        //         const { email, userPassword } = req.body; // changed userName to email
        //         const user = await userCreation.findOne({ email }); // find user by email

        //         if (!user) {
        //             return res.status(404).json({ message: "User Not Found", status: 404, isValid: false });
        //         }

        //         console.log("userPassword", userPassword, "user.userPassword", user.userPassword);
        //         const isMatch = await bcrypt.compare(userPassword, user.userPassword);

        //         console.log("isMatch", isMatch);
        //         if (!isMatch) {
        //             return res.status(400).json({ message: "Invalid Credentials", status: 400, isValid: false });
        //         }

        //         const token = jwt.sign(
        //             { id: user._id, email: user.email }, // changed userName to email in the JWT payload
        //             process.env.JWT_SECRET || "your_jwt_secret",
        //             { expiresIn: "1h" }
        //         );

        //         res.status(200).json({ message: "Login Successful", status: 200, isValid: true, token });
        //     } catch (error) {
        //         res.status(500).json({ message: "Server Error", status: 500, isValid: false, error: error.message });
        //     }
        // }





        // new code end 


        // approvalList: async (req, res) => {
        //     try {
        //         let list;        
        //         list = await Approval.find();        
        //         res.status(200).json({ responseData: { message: "ApprovalList fetched successfully", data: list } });
        //     } catch (err) {
        //         console.error("Error fetching users:", err);
        //         res.status(500).json({ error: "Failed to fetch users" });
        //     }
        // },




    };
})();

const sendEmails = async (recipient, subject, message) => {
    const mailOptions = {
        from: 'noreply.itapps@hbl.in',
        to: 'sriramunaidug@sharviinfotech.com',
        subject: 'Forgot Deatils',
        text: message,
    };

    return transporter.sendMail(mailOptions);
};
const transporter = nodemailer.createTransport({
    host: "smtp.logix.in",
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: "noreply.itapps@hbl.in",
        pass: "Happy#1968",
    },
});

const enterIntoSendMail = async (obj) => {
    const mailOptions = {
        from: 'noreply.itapps@hbl.in',
        to: obj.userEmail,
        subject: 'Your Login Credentials',
        html: `
         <p>Dear User,</p>
    
    <p>We are pleased to provide you with your login credentials:</p>
    
    <p><strong>Username:</strong> ${obj.userName}</p>  
    <p><strong>Password:</strong> ${obj.userPassword}</p>  
    
    <p>For security reasons, please keep this information strictly confidential. If you have any questions or require assistance, do not hesitate to contact our support team.</p>  
    
    <p>Best regards,</p>  
    <p> Sharviinfotech</p>  
    
        `,
    };
    await transporter.sendMail(mailOptions);
}


